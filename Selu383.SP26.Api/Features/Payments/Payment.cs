namespace Selu383.SP26.Api.Features.Payments;

public class Payment
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? OrderId { get; set; }

    public int? GiftCardId { get; set; }

    public decimal Amount { get; set; }

    public string Method { get; set; } = string.Empty;

    public string Status { get; set; } = "Approved";

    public string ProviderReference { get; set; } = string.Empty;

    public string ExternalIntentId { get; set; } = string.Empty;

    public string CardLastFour { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
