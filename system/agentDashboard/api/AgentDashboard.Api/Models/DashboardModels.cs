namespace AgentDashboard.Api.Models;

public record DashboardState
{
    public string SessionId { get; init; } = "";
    public string Task { get; init; } = "";
    public string Phase { get; init; } = "";
    public DateTimeOffset StartedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public string Status { get; init; } = "idle";
    public List<AgentState> ActiveAgents { get; init; } = [];
    public List<AgentState> CompletedAgents { get; init; } = [];
    public string? CurrentGate { get; init; }
    public decimal TotalCostUsd { get; init; }
    public List<LogEntry> Log { get; init; } = [];
}

public record AgentState
{
    public string Name { get; init; } = "";
    public string Status { get; init; } = "idle";
    public string Phase { get; init; } = "";
    public DateTimeOffset SpawnedAt { get; init; }
    public DateTimeOffset? CompletedAt { get; init; }
    public decimal CostUsd { get; init; }
    public string Model { get; init; } = "";
}

public record LogEntry
{
    public string Time { get; init; } = "";
    public string Type { get; init; } = "";
    public string? Agent { get; init; }
    public string Message { get; init; } = "";
}
