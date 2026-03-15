namespace Selu383.SP26.Api.Features.Payments;

public class GiftCard
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public decimal InitialBalance { get; set; }

    public decimal Balance { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;

    public int? PurchasedByUserId { get; set; }
}
