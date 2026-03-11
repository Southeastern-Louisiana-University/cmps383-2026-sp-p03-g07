using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Auth;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<DataContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DataContext")));

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
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var logger = scope.ServiceProvider
        .GetRequiredService<ILoggerFactory>()
        .CreateLogger("Startup");

    const int maxAttempts = 12;
    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await SeedHelper.MigrateAndSeed(scope.ServiceProvider);
            break;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            logger.LogWarning(
                ex,
                "Database migration attempt {Attempt} of {MaxAttempts} failed. Retrying in 5 seconds.",
                attempt,
                maxAttempts);

            await Task.Delay(TimeSpan.FromSeconds(5));
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app
    .UseRouting()
    .UseAuthentication()
    .UseAuthorization()
    .UseEndpoints(x =>
    {
        x.MapControllers();
    });

app.UseStaticFiles();

if(app.Environment.IsDevelopment())
{
    app.UseSpa(x =>
    {
        x.UseProxyToSpaDevelopmentServer("http://localhost:5173");
    });
}
else
{
    app.MapFallbackToFile("/index.html");
}

app.Run();

//see: https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-8.0
// Hi 383 - this is added so we can test our web project automatically
public partial class Program { }
