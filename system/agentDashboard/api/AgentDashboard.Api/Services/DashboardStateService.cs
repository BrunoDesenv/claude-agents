using System.Text.Json;
using AgentDashboard.Api.Models;

namespace AgentDashboard.Api.Services;

public class DashboardStateService
{
    private readonly string _stateFilePath;
    private readonly string _historyDirPath;
    private DashboardState _state = new();
    private readonly object _lock = new();

    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = true };

    public DashboardStateService(IWebHostEnvironment env)
    {
        var root = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", ".."));
        _stateFilePath = Path.Combine(root, "state.json");
        _historyDirPath = Path.Combine(root, "history");
        Directory.CreateDirectory(_historyDirPath);

        if (File.Exists(_stateFilePath))
            _state = NormalizeLoaded(TryDeserialize(_stateFilePath) ?? new DashboardState());
    }

    public DashboardState GetState()
    {
        lock (_lock) return _state;
    }

    public DashboardState ProcessEvent(EventRequest request)
    {
        lock (_lock)
        {
            _state = request.Type switch
            {
                "session-start"      => HandleSessionStart(request),
                "agent-spawn"        => HandleAgentSpawn(request),
                "agent-done"         => HandleAgentDone(request),
                "agent-cost-update"  => HandleAgentCostUpdate(request),
                "gate"               => HandleGate(request),
                "gate-clear"         => HandleGateClear(request),
                "session-end"        => HandleSessionEnd(request),
                "clear"              => new DashboardState(),
                _                    => _state
            };
            Persist(_stateFilePath, _state);
            return _state;
        }
    }

    public List<DashboardState> GetHistory()
    {
        if (!Directory.Exists(_historyDirPath)) return [];
        return Directory.GetFiles(_historyDirPath, "*.json")
            .Select(f => TryDeserialize(f))
            .Where(s => s is not null)
            .Select(s => s!)
            .OrderByDescending(s => s.StartedAt)
            .ToList();
    }

    private DashboardState HandleSessionStart(EventRequest req)
    {
        var p = req.Payload;
        var now = DateTimeOffset.UtcNow;
        var started = p.Started is not null ? DateTimeOffset.Parse(p.Started) : now;
        return new DashboardState
        {
            SessionId = req.SessionId,
            Task = p.Task ?? "",
            Phase = "Starting",
            StartedAt = started,
            UpdatedAt = now,
            Status = "running",
            ActiveAgents =
            [
                new AgentState { Name = "master", Status = "working", Phase = "Starting", SpawnedAt = now }
            ],
            Log =
            [
                new LogEntry { Time = now.ToString("HH:mm:ss"), Type = "session-start", Message = $"Session started: {p.Task}" }
            ]
        };
    }

    private DashboardState HandleAgentSpawn(EventRequest req)
    {
        var p = req.Payload;
        var now = DateTimeOffset.UtcNow;
        var newAgent = new AgentState
        {
            Name = p.Agent ?? "",
            Status = "working",
            Phase = p.Phase ?? "",
            SpawnedAt = now,
            Model = p.Model ?? ""
        };
        return _state with
        {
            Phase = p.Phase ?? _state.Phase,
            UpdatedAt = now,
            ActiveAgents = [.. _state.ActiveAgents, newAgent],
            Log =
            [
                .. _state.Log,
                new LogEntry { Time = now.ToString("HH:mm:ss"), Type = "agent-spawn", Agent = p.Agent, Message = $"{p.Agent} spawned — {p.Phase}" }
            ]
        };
    }

    private DashboardState HandleAgentDone(EventRequest req)
    {
        var p = req.Payload;
        var now = DateTimeOffset.UtcNow;
        var agent = _state.ActiveAgents.FirstOrDefault(a => a.Name == p.Agent);
        if (agent is null) return _state;

        var completed = agent with
        {
            Status = p.Status == "fail" ? "fail" : "done",
            CompletedAt = now,
            CostUsd = p.Cost ?? 0
        };

        return _state with
        {
            UpdatedAt = now,
            TotalCostUsd = _state.TotalCostUsd + (p.Cost ?? 0),
            ActiveAgents = _state.ActiveAgents.Where(a => a.Name != p.Agent).ToList(),
            CompletedAgents = [.. _state.CompletedAgents, completed],
            Log =
            [
                .. _state.Log,
                new LogEntry
                {
                    Time = now.ToString("HH:mm:ss"),
                    Type = "agent-done",
                    Agent = p.Agent,
                    Message = $"{p.Agent} {(p.Status == "fail" ? "FAILED" : "completed")} (${p.Cost:F2})"
                }
            ]
        };
    }

    private DashboardState HandleGate(EventRequest req)
    {
        var p = req.Payload;
        var now = DateTimeOffset.UtcNow;
        return _state with
        {
            CurrentGate = p.GateName,
            UpdatedAt = now,
            Log =
            [
                .. _state.Log,
                new LogEntry { Time = now.ToString("HH:mm:ss"), Type = "gate", Message = $"Gate: {p.GateName}" }
            ]
        };
    }

    private DashboardState HandleGateClear(EventRequest req)
    {
        var now = DateTimeOffset.UtcNow;
        return _state with
        {
            CurrentGate = null,
            UpdatedAt = now,
            Log =
            [
                .. _state.Log,
                new LogEntry { Time = now.ToString("HH:mm:ss"), Type = "gate-clear", Message = "Gate cleared" }
            ]
        };
    }

    private DashboardState HandleSessionEnd(EventRequest req)
    {
        var p = req.Payload;
        var now = DateTimeOffset.UtcNow;

        var drainedAgents = _state.ActiveAgents
            .Select(a => a with { Status = "done", CompletedAt = now })
            .ToList();

        var finalState = _state with
        {
            Status = p.Status ?? "completed",
            TotalCostUsd = p.TotalCost ?? _state.TotalCostUsd,
            UpdatedAt = now,
            ActiveAgents = [],
            CompletedAgents = [.. _state.CompletedAgents, .. drainedAgents],
            Log =
            [
                .. _state.Log,
                new LogEntry
                {
                    Time = now.ToString("HH:mm:ss"),
                    Type = "session-end",
                    Message = $"Session {p.Status ?? "completed"} — total cost ${p.TotalCost:F2}"
                }
            ]
        };

        var histPath = Path.Combine(_historyDirPath, $"{req.SessionId}.json");
        Persist(histPath, finalState);
        return finalState;
    }

    private DashboardState HandleAgentCostUpdate(EventRequest req)
    {
        var p = req.Payload;
        var now = DateTimeOffset.UtcNow;
        var list = _state.CompletedAgents.ToList();
        var agentName = p.Agent ?? "";
        // Prefer first unpriced entry so repeated agents (validator ×2, qa reruns)
        // are filled in chronological order rather than always overwriting the latest.
        var idx = list.FindIndex(a => a.Name == agentName && a.CostUsd == 0);
        if (idx < 0) idx = list.FindLastIndex(a => a.Name == agentName); // fallback if all priced
        if (idx < 0) return _state;

        var newCost = p.Cost ?? 0;
        var delta = newCost - list[idx].CostUsd;
        list[idx] = list[idx] with { CostUsd = newCost };

        return _state with
        {
            UpdatedAt = now,
            TotalCostUsd = _state.TotalCostUsd + delta,
            CompletedAgents = list
        };
    }

    private static DashboardState NormalizeLoaded(DashboardState state)
    {
        if (state.ActiveAgents.Count == 0) return state;
        if (state.Status is not ("completed" or "failed")) return state;

        var drained = state.ActiveAgents
            .Select(a => a with { Status = "done", CompletedAt = DateTimeOffset.UtcNow })
            .ToList();
        return state with
        {
            ActiveAgents = [],
            CompletedAgents = [.. state.CompletedAgents, .. drained]
        };
    }

    private static void Persist(string path, DashboardState state)
    {
        try { File.WriteAllText(path, JsonSerializer.Serialize(state, JsonOpts)); }
        catch { /* best-effort */ }
    }

    private static DashboardState? TryDeserialize(string path)
    {
        try { return JsonSerializer.Deserialize<DashboardState>(File.ReadAllText(path)); }
        catch { return null; }
    }
}
