namespace Selu383.SP26.Api.Features.Rewards;

public class Reward
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int PointCost { get; set; }

    public bool IsActive { get; set; } = true;
}
