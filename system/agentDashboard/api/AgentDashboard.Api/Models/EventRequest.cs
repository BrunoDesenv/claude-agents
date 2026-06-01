namespace AgentDashboard.Api.Models;

public record EventRequest
{
    public string Type { get; init; } = "";
    public string SessionId { get; init; } = "";
    public EventPayload Payload { get; init; } = new();
}

public record EventPayload
{
    public string? Task { get; init; }
    public string? Started { get; init; }
    public string? Agent { get; init; }
    public string? Phase { get; init; }
    public string? Model { get; init; }
    public decimal? Cost { get; init; }
    public string? Status { get; init; }
    public string? GateName { get; init; }
    public decimal? TotalCost { get; init; }
}
