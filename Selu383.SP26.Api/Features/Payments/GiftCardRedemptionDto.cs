using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Payments;

public class GiftCardRedemptionDto
{
    [Required]
    public string Code { get; set; } = string.Empty;

    [Range(0.01, 500)]
    public decimal Amount { get; set; }

    public int? OrderId { get; set; }
}
