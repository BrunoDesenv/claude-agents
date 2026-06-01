using AgentDashboard.Api.Hubs;
using AgentDashboard.Api.Models;
using AgentDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AgentDashboard.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly DashboardStateService _state;
    private readonly MessagesService _messages;
    private readonly IHubContext<DashboardHub> _hub;

    public DashboardController(
        DashboardStateService state,
        MessagesService messages,
        IHubContext<DashboardHub> hub)
    {
        _state = state;
        _messages = messages;
        _hub = hub;
    }

    [HttpPost("event")]
    public async Task<IActionResult> PostEvent([FromBody] EventRequest request)
    {
        var newState = _state.ProcessEvent(request);
        await _hub.Clients.All.SendAsync("StateUpdated", newState);
        return Ok(new { ok = true });
    }

    [HttpGet("state")]
    public IActionResult GetState() => Ok(_state.GetState());

    [HttpGet("history")]
    public IActionResult GetHistory() => Ok(_state.GetHistory());

    [HttpPost("message")]
    public async Task<IActionResult> PostMessage([FromBody] MessageRequest request)
    {
        if (string.IsNullOrEmpty(request.Content))
            return BadRequest(new { error = "content is required" });

        if (request.Content.Length > 2000)
            return BadRequest(new { error = "content exceeds 2000 characters" });

        var activeSessionId = _state.GetState().SessionId;
        if (!string.Equals(request.SessionId, activeSessionId, StringComparison.Ordinal)
            || string.IsNullOrEmpty(activeSessionId))
            return BadRequest(new { error = "sessionId does not match active session" });

        var msg = _messages.Enqueue(request.SessionId, request.Content);
        await _hub.Clients.All.SendAsync("MessageReceived", msg);
        return Ok(msg);
    }

    [HttpGet("messages")]
    public IActionResult GetMessages([FromQuery] string sessionId, [FromQuery] string status = "all")
    {
        if (string.IsNullOrEmpty(sessionId))
            return BadRequest(new { error = "sessionId is required" });

        if (status != "pending" && status != "all")
            return BadRequest(new { error = "status must be 'pending' or 'all'" });

        var messages = _messages.GetMessages(sessionId, status);
        return Ok(messages);
    }

    [HttpPatch("messages/{id}/reply")]
    public async Task<IActionResult> PatchReply(string id, [FromBody] ReplyRequest request)
    {
        if (string.IsNullOrEmpty(request.Reply))
            return BadRequest(new { error = "reply is required" });

        var updated = _messages.PostReply(id, request.Reply);
        if (updated is null)
            return NotFound(new { error = $"message {id} not found" });

        await _hub.Clients.All.SendAsync("MessageReplied", updated);
        return Ok(updated);
    }
}
