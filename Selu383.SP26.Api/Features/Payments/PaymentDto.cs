namespace Selu383.SP26.Api.Features.Payments;

public class PaymentDto
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? OrderId { get; set; }

    public decimal Amount { get; set; }

    public string Method { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string ProviderReference { get; set; } = string.Empty;

    public string CardLastFour { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}
