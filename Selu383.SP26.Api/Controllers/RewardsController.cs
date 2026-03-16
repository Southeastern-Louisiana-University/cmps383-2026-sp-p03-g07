using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Rewards;
using System.Security.Claims;
using Selu383.SP26.Api.Services;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/rewards")]
public class RewardsController : ControllerBase
{
    private readonly DataContext _context;
    private readonly PushNotificationService _pushNotificationService;
    private readonly StarEarningService _starEarningService;

    public RewardsController(
        DataContext context,
        PushNotificationService pushNotificationService,
        StarEarningService starEarningService)
    {
        _context = context;
        _pushNotificationService = pushNotificationService;
        _starEarningService = starEarningService;
    }

    // GET /api/rewards - Get all available rewards
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RewardDto>>> GetRewards()
    {
        var rewards = await _context.Rewards
            .Where(r => r.IsActive)
            .Select(r => new RewardDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                PointsCost = r.PointsCost,
                IsActive = r.IsActive,
                TierName = r.TierName,
                OfferType = r.OfferType,
                DiscountAmount = r.DiscountAmount,
                BonusStars = r.BonusStars
            })
            .ToListAsync();

        return Ok(rewards);
    }

    [HttpGet("tiers")]
    public async Task<ActionResult<IEnumerable<RewardTierDto>>> GetTiers()
    {
        var tiers = await _context.RewardTiers
            .OrderBy(x => x.MinPoints)
            .Select(x => new RewardTierDto
            {
                Id = x.Id,
                Name = x.Name,
                MinPoints = x.MinPoints,
                Benefits = x.Benefits,
                AccentColor = x.AccentColor
            })
            .ToListAsync();

        return Ok(tiers);
    }

    // GET /api/rewards/my-points - Get current user's points balance
    [Authorize]
    [HttpGet("my-points")]
    public async Task<ActionResult<PointsBalanceDto>> GetMyPoints()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(_starEarningService.BuildBalance(user.Points));
    }

    // POST /api/rewards/redeem/{rewardId} - Redeem a reward
    [Authorize]
    [HttpPost("redeem/{rewardId}")]
    public async Task<ActionResult> RedeemReward(int rewardId)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        var reward = await _context.Rewards.FindAsync(rewardId);
        if (reward == null || !reward.IsActive)
        {
            return NotFound("Reward not found");
        }

        if (user.Points < reward.PointsCost)
        {
            return BadRequest("Insufficient points");
        }

        // Deduct points
        user.Points -= reward.PointsCost;

        // Record redemption
        var userReward = new UserReward
        {
            UserId = userId,
            RewardId = rewardId,
            RedeemedAt = DateTime.UtcNow,
            RewardName = reward.Name,
            PointsSpent = reward.PointsCost
        };

        _context.UserRewards.Add(userReward);
        await _context.SaveChangesAsync();

        await _pushNotificationService.SendAsync(
            userId,
            "SMS",
            "Reward redeemed",
            $"{reward.Name} redeemed for {reward.PointsCost} stars.");

        return Ok(new { message = "Reward redeemed successfully", remainingPoints = user.Points });
    }

    // GET /api/rewards/my-history - Get user's redemption history
    [Authorize]
    [HttpGet("my-history")]
    public async Task<ActionResult> GetMyHistory()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var history = await _context.UserRewards
            .Where(ur => ur.UserId == userId)
            .Select(ur => new
            {
                rewardName = ur.RewardName,
                pointsCost = ur.PointsSpent,
                redeemedAt = ur.RedeemedAt
            })
            .OrderByDescending(x => x.redeemedAt)
            .ToListAsync();

        return Ok(history);
    }
}
