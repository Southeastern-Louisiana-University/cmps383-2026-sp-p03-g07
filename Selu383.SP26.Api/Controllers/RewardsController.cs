using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Rewards;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api")]
public class RewardsController(DataContext dataContext) : ControllerBase
{
    [HttpGet("points")]
    [Authorize]
    public ActionResult<UserPointsDto> GetPoints()
    {
        var userId = User.GetCurrentUserId()!.Value;

        var userPoints = dataContext.Set<UserPoints>().FirstOrDefault(x => x.UserId == userId);
        var transactions = dataContext.Set<PointTransaction>()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new PointTransactionDto
            {
                Id = x.Id,
                Amount = x.Amount,
                Reason = x.Reason,
                CreatedAt = x.CreatedAt
            })
            .ToList();

        return Ok(new UserPointsDto
        {
            Balance = userPoints?.Balance ?? 0,
            Transactions = transactions
        });
    }

    [HttpPost("points/earn")]
    [Authorize]
    public ActionResult<UserPointsDto> EarnPoints([FromBody] decimal orderTotal)
    {
        var userId = User.GetCurrentUserId()!.Value;
        var pointsToAdd = (int)Math.Floor(orderTotal);

        var userPoints = dataContext.Set<UserPoints>().FirstOrDefault(x => x.UserId == userId);
        if (userPoints == null)
        {
            userPoints = new UserPoints { UserId = userId, Balance = 0 };
            dataContext.Set<UserPoints>().Add(userPoints);
        }

        userPoints.Balance += pointsToAdd;

        var transaction = new PointTransaction
        {
            UserId = userId,
            Amount = pointsToAdd,
            Reason = $"Earned from order (${orderTotal:F2})",
            CreatedAt = DateTime.UtcNow
        };

        dataContext.Set<PointTransaction>().Add(transaction);
        dataContext.SaveChanges();

        return Ok(new UserPointsDto
        {
            Balance = userPoints.Balance,
            Transactions = new List<PointTransactionDto> { new() { Id = transaction.Id, Amount = transaction.Amount, Reason = transaction.Reason, CreatedAt = transaction.CreatedAt } }
        });
    }

    [HttpGet("rewards")]
    public IQueryable<RewardDto> GetRewards()
    {
        return dataContext.Set<Reward>()
            .Where(x => x.IsActive)
            .Select(x => new RewardDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                PointCost = x.PointCost,
                IsActive = x.IsActive
            });
    }

    [HttpPost("rewards/redeem")]
    [Authorize]
    public ActionResult<RewardRedemptionDto> Redeem([FromBody] int rewardId)
    {
        var userId = User.GetCurrentUserId()!.Value;

        var reward = dataContext.Set<Reward>().FirstOrDefault(x => x.Id == rewardId && x.IsActive);
        if (reward == null)
        {
            return NotFound("Reward not found.");
        }

        var userPoints = dataContext.Set<UserPoints>().FirstOrDefault(x => x.UserId == userId);
        if (userPoints == null || userPoints.Balance < reward.PointCost)
        {
            return BadRequest("Not enough points.");
        }

        userPoints.Balance -= reward.PointCost;

        var transaction = new PointTransaction
        {
            UserId = userId,
            Amount = -reward.PointCost,
            Reason = $"Redeemed: {reward.Name}",
            CreatedAt = DateTime.UtcNow
        };
        dataContext.Set<PointTransaction>().Add(transaction);

        var redemption = new RewardRedemption
        {
            UserId = userId,
            RewardId = rewardId,
            RedeemedAt = DateTime.UtcNow
        };
        dataContext.Set<RewardRedemption>().Add(redemption);

        dataContext.SaveChanges();

        return Ok(new RewardRedemptionDto
        {
            Id = redemption.Id,
            RewardId = reward.Id,
            RewardName = reward.Name,
            PointCost = reward.PointCost,
            RedeemedAt = redemption.RedeemedAt,
            IsUsed = false,
            RewardType = reward.RewardType,
            DiscountValue = reward.DiscountValue,
            FreeMenuItemId = reward.FreeMenuItemId
        });
    }

    [HttpGet("rewards/active")]
    [Authorize]
    public ActionResult<List<RewardRedemptionDto>> GetActiveRedemptions()
    {
        var userId = User.GetCurrentUserId()!.Value;

        var results = dataContext.Set<RewardRedemption>()
            .Include(x => x.Reward)
            .Where(x => x.UserId == userId && !x.IsUsed)
            .Select(x => new RewardRedemptionDto
            {
                Id = x.Id,
                RewardId = x.RewardId,
                RewardName = x.Reward!.Name,
                PointCost = x.Reward.PointCost,
                RedeemedAt = x.RedeemedAt,
                IsUsed = x.IsUsed,
                RewardType = x.Reward.RewardType,
                DiscountValue = x.Reward.DiscountValue,
                FreeMenuItemId = x.Reward.FreeMenuItemId
            })
            .ToList();

        return Ok(results);
    }

    [HttpGet("rewards/redemptions")]
    [Authorize]
    public ActionResult<List<RewardRedemptionDto>> GetRedemptions()
    {
        var userId = User.GetCurrentUserId()!.Value;

        var results = dataContext.Set<RewardRedemption>()
            .Include(x => x.Reward)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.RedeemedAt)
            .Select(x => new RewardRedemptionDto
            {
                Id = x.Id,
                RewardId = x.RewardId,
                RewardName = x.Reward!.Name,
                PointCost = x.Reward.PointCost,
                RedeemedAt = x.RedeemedAt,
                IsUsed = x.IsUsed,
                RewardType = x.Reward.RewardType,
                DiscountValue = x.Reward.DiscountValue,
                FreeMenuItemId = x.Reward.FreeMenuItemId
            })
            .ToList();

        return Ok(results);
    }
}
