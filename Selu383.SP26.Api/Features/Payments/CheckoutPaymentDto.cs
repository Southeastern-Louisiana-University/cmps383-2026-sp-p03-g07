using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Payments;

public class CheckoutPaymentDto
{
    [Required]
    public int OrderId { get; set; }

    public string PaymentMethod { get; set; } = "Card";

    public decimal? Amount { get; set; }

    public string GiftCardCode { get; set; } = string.Empty;

    public string CardLastFour { get; set; } = string.Empty;
}
