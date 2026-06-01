namespace AgentDashboard.Api.Models;

public record DashboardMessage
{
    public string Id { get; init; } = Guid.NewGuid().ToString();
    public string SessionId { get; init; } = "";
    public string Content { get; init; } = "";
    public string? Reply { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? RepliedAt { get; init; }
    public string Status { get; init; } = "pending";   // "pending" | "processing" | "replied"
}
