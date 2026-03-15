using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Feedback;

public class CreateFeedbackDto
{
    public int? OrderId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string Comment { get; set; } = string.Empty;
}
