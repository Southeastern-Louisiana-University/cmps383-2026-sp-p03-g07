using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Payments;

public class GiftCardPurchaseDto
{
    [Range(5, 500)]
    public decimal Amount { get; set; }

    public string RecipientName { get; set; } = string.Empty;

    public string RecipientEmail { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;
}
