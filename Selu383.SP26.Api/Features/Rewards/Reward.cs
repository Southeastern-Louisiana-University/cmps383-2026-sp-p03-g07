namespace Selu383.SP26.Api.Features.Rewards;

public class Reward
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int PointCost { get; set; }

    public bool IsActive { get; set; } = true;

    // "discount" or "free_item"
    public string RewardType { get; set; } = "discount";

    // For discount rewards: percent off (e.g. 10 = 10% off)
    public decimal DiscountValue { get; set; } = 0;

    // For free_item rewards: which menu item to add for free
    public int? FreeMenuItemId { get; set; }
}
