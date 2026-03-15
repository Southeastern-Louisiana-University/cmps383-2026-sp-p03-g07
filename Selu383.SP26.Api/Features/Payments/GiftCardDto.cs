namespace Selu383.SP26.Api.Features.Payments;

public class GiftCardDto
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public decimal InitialBalance { get; set; }

    public decimal Balance { get; set; }

    public bool IsActive { get; set; }

    public DateTime PurchasedAt { get; set; }
}
