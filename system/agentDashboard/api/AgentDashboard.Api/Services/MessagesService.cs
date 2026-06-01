using System.Text.Json;
using AgentDashboard.Api.Models;

namespace AgentDashboard.Api.Services;

public class MessagesService
{
    private readonly string _messagesFilePath;
    private readonly List<DashboardMessage> _messages;
    private readonly object _lock = new();

    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = true };

    public MessagesService(IWebHostEnvironment env)
    {
        var root = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", ".."));
        _messagesFilePath = Path.Combine(root, "messages.json");

        _messages = File.Exists(_messagesFilePath)
            ? TryDeserialize() ?? []
            : [];
    }

    public DashboardMessage Enqueue(string sessionId, string content)
    {
        lock (_lock)
        {
            var msg = new DashboardMessage
            {
                Id = Guid.NewGuid().ToString(),
                SessionId = sessionId,
                Content = content,
                CreatedAt = DateTimeOffset.UtcNow,
                Status = "pending"
            };
            _messages.Add(msg);
            Persist();
            return msg;
        }
    }

    public List<DashboardMessage> GetMessages(string sessionId, string status)
    {
        lock (_lock)
        {
            if (status == "pending")
            {
                var pendingIds = _messages
                    .Where(m => m.SessionId == sessionId && m.Status == "pending")
                    .Select(m => m.Id)
                    .ToHashSet();

                if (pendingIds.Count > 0)
                {
                    for (var i = 0; i < _messages.Count; i++)
                    {
                        if (_messages[i].SessionId == sessionId && _messages[i].Status == "pending")
                            _messages[i] = _messages[i] with { Status = "processing" };
                    }
                    Persist();
                }

                return _messages
                    .Where(m => m.SessionId == sessionId && pendingIds.Contains(m.Id))
                    .ToList();
            }

            return _messages
                .Where(m => m.SessionId == sessionId)
                .ToList();
        }
    }

    public DashboardMessage? PostReply(string id, string reply)
    {
        lock (_lock)
        {
            var idx = _messages.FindIndex(m => m.Id == id);
            if (idx < 0) return null;

            var existing = _messages[idx];
            if (existing.Status == "replied") return existing;

            var updated = existing with
            {
                Reply = reply,
                RepliedAt = DateTimeOffset.UtcNow,
                Status = "replied"
            };
            _messages[idx] = updated;
            Persist();
            return updated;
        }
    }

    private void Persist()
    {
        try { File.WriteAllText(_messagesFilePath, JsonSerializer.Serialize(_messages, JsonOpts)); }
        catch { /* best-effort */ }
    }

    private List<DashboardMessage>? TryDeserialize()
    {
        try { return JsonSerializer.Deserialize<List<DashboardMessage>>(File.ReadAllText(_messagesFilePath)); }
        catch { return null; }
    }
}
