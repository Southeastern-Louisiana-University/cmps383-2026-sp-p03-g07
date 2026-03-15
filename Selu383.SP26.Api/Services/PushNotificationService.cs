using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Notifications;

namespace Selu383.SP26.Api.Services;

public class PushNotificationService(DataContext dataContext, ILogger<PushNotificationService> logger)
{
    public async Task<Notification> SendAsync(int? userId, string channel, string title, string message)
    {
        var notification = new Notification
        {
            UserId = userId,
            Channel = string.IsNullOrWhiteSpace(channel) ? "InApp" : channel,
            Title = title,
            Message = message,
            CreatedAt = DateTime.UtcNow
        };

        dataContext.Notifications.Add(notification);
        await dataContext.SaveChangesAsync();

        logger.LogInformation(
            "Queued {Channel} notification for user {UserId}: {Title}",
            notification.Channel,
            notification.UserId,
            notification.Title);

        return notification;
    }
}
