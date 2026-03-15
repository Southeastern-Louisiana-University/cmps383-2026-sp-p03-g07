namespace Selu383.SP26.Api.Features.Rewards;

public class RewardRedemption
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int RewardId { get; set; }

    public virtual Reward? Reward { get; set; }

    public DateTime RedeemedAt { get; set; } = DateTime.UtcNow;

    public bool IsUsed { get; set; } = false;
}
