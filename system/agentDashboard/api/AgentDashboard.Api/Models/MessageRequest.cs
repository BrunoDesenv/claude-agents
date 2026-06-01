namespace AgentDashboard.Api.Models;

public record MessageRequest
{
    public string SessionId { get; init; } = "";
    public string Content { get; init; } = "";
}
