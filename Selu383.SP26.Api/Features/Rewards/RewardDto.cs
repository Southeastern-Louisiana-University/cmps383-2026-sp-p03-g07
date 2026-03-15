namespace Selu383.SP26.Api.Features.Rewards;

public class RewardDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PointsCost { get; set; }
    public bool IsActive { get; set; }
    public string TierName { get; set; } = string.Empty;
    public string OfferType { get; set; } = string.Empty;
    public decimal? DiscountAmount { get; set; }
    public int BonusStars { get; set; }
}
