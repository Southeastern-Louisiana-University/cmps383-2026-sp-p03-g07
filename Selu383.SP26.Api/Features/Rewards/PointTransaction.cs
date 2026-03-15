namespace Selu383.SP26.Api.Features.Rewards;

public class PointTransaction
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int Amount { get; set; }

    public string Reason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
