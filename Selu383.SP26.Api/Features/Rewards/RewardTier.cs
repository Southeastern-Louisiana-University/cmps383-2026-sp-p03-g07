namespace Selu383.SP26.Api.Features.Rewards;

public class RewardTier
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int MinPoints { get; set; }

    public string Benefits { get; set; } = string.Empty;

    public string AccentColor { get; set; } = string.Empty;
}
