using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Feedback;

public class CreateFeedbackDto
{
    [Required]
    public string Category { get; set; } = string.Empty;

    [Range(1, 5)]
    public int Rating { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Comment { get; set; } = string.Empty;
}

public class FeedbackDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
