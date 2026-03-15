namespace Selu383.SP26.Api.Features.Rewards;

public class UserReward
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int RewardId { get; set; }
    public DateTime RedeemedAt { get; set; }
    public string RewardName { get; set; } = string.Empty;
    public int PointsSpent { get; set; }
}
