using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Auth;
var builder = WebApplication.CreateBuilder(args);
var spaDevServerUrl = builder.Configuration["Spa:DevServerUrl"] ?? "http://localhost:5173";
var isRunningInContainer = string.Equals(
    Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"),
    "true",
    StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<DataContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DataContext")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:8081",
                "http://localhost:19006",
                "http://10.0.2.2:8081",
                "https://selu383-sp26-p03-g07.azurewebsites.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddIdentity<User, Role>()
    .AddEntityFrameworkStores<DataContext>();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    await SeedHelper.MigrateAndSeed(scope.ServiceProvider);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!isRunningInContainer)
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.UseSpa(x =>
    {
        x.UseProxyToSpaDevelopmentServer(spaDevServerUrl);
    });
}
else
{
    app.MapFallbackToFile("/index.html");
}

app.Run();

public partial class Program { }
