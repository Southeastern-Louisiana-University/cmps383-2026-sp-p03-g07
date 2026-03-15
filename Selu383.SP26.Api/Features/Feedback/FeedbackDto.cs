namespace Selu383.SP26.Api.Features.Feedback;

public class FeedbackDto
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public int? OrderId { get; set; }

    public int Rating { get; set; }

    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}
