using AgentDashboard.Api.Hubs;
using AgentDashboard.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<DashboardStateService>();
builder.Services.AddSingleton<MessagesService>();

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins("http://localhost:4300")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

var app = builder.Build();

app.UseCors();
app.MapControllers();
app.MapHub<DashboardHub>("/dashboardHub");

app.Run("http://localhost:5200");
