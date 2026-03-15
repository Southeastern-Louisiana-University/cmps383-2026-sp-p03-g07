namespace Selu383.SP26.Api.Features.Rewards;

public class RewardRedemptionDto
{
    public int Id { get; set; }

    public int RewardId { get; set; }

    public string RewardName { get; set; } = string.Empty;

    public int PointCost { get; set; }

    public DateTime RedeemedAt { get; set; }
}
