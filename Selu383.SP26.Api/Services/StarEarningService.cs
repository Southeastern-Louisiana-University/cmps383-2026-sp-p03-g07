using Selu383.SP26.Api.Features.Rewards;

namespace Selu383.SP26.Api.Services;

public class StarEarningService
{
    private static readonly RewardTierInfo[] Tiers =
    [
        new("Bronze", 0),
        new("Silver", 150),
        new("Gold", 300)
    ];

    public int CalculateStars(decimal total, int currentPoints)
    {
        var multiplier = GetTier(currentPoints) switch
        {
            "Gold" => 2.0m,
            "Silver" => 1.5m,
            _ => 1.0m
        };

        var stars = (int)Math.Floor(total * multiplier);
        return Math.Max(stars, 1);
    }

    public string GetTier(int points)
    {
        return Tiers
            .Where(x => points >= x.MinPoints)
            .OrderByDescending(x => x.MinPoints)
            .Select(x => x.Name)
            .First();
    }

    public string GetNextTier(int points)
    {
        return Tiers
            .Where(x => x.MinPoints > points)
            .OrderBy(x => x.MinPoints)
            .Select(x => x.Name)
            .FirstOrDefault() ?? GetTier(points);
    }

    public int GetPointsToNextTier(int points)
    {
        var nextTier = Tiers
            .Where(x => x.MinPoints > points)
            .OrderBy(x => x.MinPoints)
            .FirstOrDefault();

        return nextTier == null ? 0 : nextTier.MinPoints - points;
    }

    public PointsBalanceDto BuildBalance(int points)
    {
        return new PointsBalanceDto
        {
            Points = points,
            CurrentTier = GetTier(points),
            NextTier = GetNextTier(points),
            PointsToNextTier = GetPointsToNextTier(points)
        };
    }

    private sealed record RewardTierInfo(string Name, int MinPoints);
}
