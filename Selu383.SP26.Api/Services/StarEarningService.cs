using Selu383.SP26.Api.Features.Rewards;

namespace Selu383.SP26.Api.Services;

public class StarEarningService
{
    public const int PointsPerDollar = 10;
    public const int RewardThreshold = 1000;
    public const int FirstTierThreshold = RewardThreshold;
    public const string MemberTierName = "Member";
    public const string RewardReadyName = "Reward ready";

    public int CalculateStars(decimal total, int currentPoints)
    {
        _ = currentPoints;
        return Math.Max((int)Math.Floor(total * PointsPerDollar), 0);
    }

    public int GetPointsToNextReward(int points) => points >= RewardThreshold
        ? 0
        : RewardThreshold - Math.Max(points, 0);

    public PointsBalanceDto BuildBalance(int points)
    {
        return new PointsBalanceDto
        {
            Points = points,
            CurrentTier = MemberTierName,
            NextTier = points >= RewardThreshold ? RewardReadyName : "Free drink or pastry",
            PointsToNextTier = GetPointsToNextReward(points)
        };
    }
}
