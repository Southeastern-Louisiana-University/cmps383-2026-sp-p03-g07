using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Notifications;
using Selu383.SP26.Api.Services;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController(
    DataContext dataContext,
    PushNotificationService pushNotificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetMine()
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var notifications = await dataContext.Notifications
            .Where(x => x.UserId == currentUserId || x.UserId == null)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new NotificationDto
            {
                Id = x.Id,
                UserId = x.UserId,
                Channel = x.Channel,
                Title = x.Title,
                Message = x.Message,
                IsRead = x.IsRead,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<ActionResult<NotificationDto>> Send(SendNotificationDto dto)
    {
        var notification = await pushNotificationService.SendAsync(
            dto.UserId,
            dto.Channel,
            dto.Title,
            dto.Message);

        return Ok(new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Channel = notification.Channel,
            Title = notification.Title,
            Message = notification.Message,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        });
    }

    [HttpPut("{id}/read")]
    public async Task<ActionResult> MarkRead(int id)
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var notification = await dataContext.Notifications
            .FirstOrDefaultAsync(x => x.Id == id && (x.UserId == currentUserId || x.UserId == null));

        if (notification == null)
        {
            return NotFound();
        }

        notification.IsRead = true;
        await dataContext.SaveChangesAsync();
        return Ok();
    }
}
