using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Payments;

public class CreateIntentDto
{
    [Required]
    public int OrderId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
}

public class CreateIntentResponseDto
{
    public string ClientSecret { get; set; } = string.Empty;
    public string IntentId { get; set; } = string.Empty;
}
