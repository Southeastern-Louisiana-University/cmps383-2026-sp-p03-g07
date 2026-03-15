namespace Selu383.SP26.Api.Features.Rewards;

public class UserPointsDto
{
    public int Balance { get; set; }

    public List<PointTransactionDto> Transactions { get; set; } = new();
}
