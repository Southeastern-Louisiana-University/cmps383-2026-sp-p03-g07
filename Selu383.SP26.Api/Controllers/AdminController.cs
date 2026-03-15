using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Selu383.SP26.Api.Features.Admin;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Services;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = RoleNames.Admin)]
public class AdminController(AnalyticsService analyticsService) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> GetDashboard()
    {
        var dashboard = await analyticsService.BuildDashboardAsync();
        return Ok(dashboard);
    }

    [HttpGet("reports/inventory")]
    public async Task<ActionResult<IEnumerable<LowInventoryItemDto>>> GetInventoryReport()
    {
        var dashboard = await analyticsService.BuildDashboardAsync();
        return Ok(dashboard.LowInventoryItems);
    }
}
