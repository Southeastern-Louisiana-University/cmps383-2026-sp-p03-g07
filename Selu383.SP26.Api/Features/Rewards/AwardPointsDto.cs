namespace Selu383.SP26.Api.Features.Rewards;

public class AwardPointsDto
{
    public int UserId { get; set; }
    public int Amount { get; set; }
    public string? Reason { get; set; }
}
