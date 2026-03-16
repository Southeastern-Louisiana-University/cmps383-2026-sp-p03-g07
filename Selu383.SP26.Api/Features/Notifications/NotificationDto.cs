namespace Selu383.SP26.Api.Features.Notifications;

public class NotificationDto
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public string Channel { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }
}
