using Selu383.SP26.Api.Features.Rewards;

namespace Selu383.SP26.Api.Services;

public class StarEarningService
{
    public const int PointsPerDollar = 10;
    public const int RewardThreshold = 1000;

    public int CalculateStars(decimal total)
    {
        if (total <= 0)
        {
            return 0;
        }

        return (int)Math.Floor(total * PointsPerDollar);
    }

    public int GetPointsToNextReward(int points)
    {
        return points >= RewardThreshold ? 0 : RewardThreshold - Math.Max(points, 0);
    }

    public PointsBalanceDto BuildBalance(int points)
    {
        var pointsToNextReward = GetPointsToNextReward(points);
        var isRewardReady = pointsToNextReward == 0 && points >= RewardThreshold;

        return new PointsBalanceDto
        {
            Points = points,
            CurrentTier = isRewardReady ? "Reward ready" : "Member",
            NextTier = "Reward",
            PointsToNextTier = pointsToNextReward
        };
    }
}
