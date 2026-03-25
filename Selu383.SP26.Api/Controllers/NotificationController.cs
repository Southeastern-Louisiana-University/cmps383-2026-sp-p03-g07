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

        var notifications = await (
            from notification in dataContext.Notifications
            where notification.UserId == currentUserId || notification.UserId == null
            join state in dataContext.NotificationUserStates.Where(x => x.UserId == currentUserId)
                on notification.Id equals state.NotificationId into stateGroup
            from state in stateGroup.DefaultIfEmpty()
            where state == null || !state.IsCleared
            orderby notification.CreatedAt descending
            select new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Channel = notification.Channel,
                Title = notification.Title,
                Message = notification.Message,
                IsRead = state != null
                    ? state.IsRead
                    : notification.UserId == currentUserId && notification.IsRead,
                CreatedAt = notification.CreatedAt
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

        var state = await dataContext.NotificationUserStates
            .FirstOrDefaultAsync(x => x.NotificationId == id && x.UserId == currentUserId);

        if (state == null)
        {
            dataContext.NotificationUserStates.Add(new NotificationUserState
            {
                NotificationId = id,
                UserId = currentUserId.Value,
                IsRead = true,
                IsCleared = false
            });
        }
        else
        {
            state.IsRead = true;
            state.IsCleared = false;
        }

        if (notification.UserId == currentUserId)
        {
            notification.IsRead = true;
        }

        await dataContext.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete]
    public async Task<ActionResult> ClearMine()
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var visibleNotificationIds = await dataContext.Notifications
            .Where(x => x.UserId == currentUserId || x.UserId == null)
            .Select(x => x.Id)
            .ToListAsync();

        if (visibleNotificationIds.Count == 0)
        {
            return Ok();
        }

        var existingStates = await dataContext.NotificationUserStates
            .Where(x => x.UserId == currentUserId && visibleNotificationIds.Contains(x.NotificationId))
            .ToListAsync();

        foreach (var state in existingStates)
        {
            state.IsRead = true;
            state.IsCleared = true;
        }

        var existingStateIds = existingStates.Select(x => x.NotificationId).ToHashSet();
        var newStates = visibleNotificationIds
            .Where(notificationId => !existingStateIds.Contains(notificationId))
            .Select(notificationId => new NotificationUserState
            {
                NotificationId = notificationId,
                UserId = currentUserId.Value,
                IsRead = true,
                IsCleared = true
            });

        dataContext.NotificationUserStates.AddRange(newStates);
        await dataContext.SaveChangesAsync();

        return Ok();
    }
}
