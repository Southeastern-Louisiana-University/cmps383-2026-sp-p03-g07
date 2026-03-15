namespace Selu383.SP26.Api.Features.Rewards;

public class RewardRedemptionDto
{
    public int Id { get; set; }

    public int RewardId { get; set; }

    public string RewardName { get; set; } = string.Empty;

    public int PointCost { get; set; }

    public DateTime RedeemedAt { get; set; }

    public bool IsUsed { get; set; }

    public string RewardType { get; set; } = "discount";

    public decimal DiscountValue { get; set; }

    public int? FreeMenuItemId { get; set; }
}
