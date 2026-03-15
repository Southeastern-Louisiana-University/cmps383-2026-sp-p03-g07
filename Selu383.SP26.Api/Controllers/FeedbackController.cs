using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Feedback;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/feedback")]
public class FeedbackController(DataContext dataContext) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    public ActionResult<FeedbackDto> Create(CreateFeedbackDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
        {
            return BadRequest("Rating must be between 1 and 5.");
        }

        var feedback = new Feedback
        {
            UserId = User.GetCurrentUserId(),
            OrderId = dto.OrderId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        dataContext.Set<Feedback>().Add(feedback);
        dataContext.SaveChanges();

        return Ok(new FeedbackDto
        {
            Id = feedback.Id,
            UserId = feedback.UserId,
            OrderId = feedback.OrderId,
            Rating = feedback.Rating,
            Comment = feedback.Comment,
            CreatedAt = feedback.CreatedAt
        });
    }

    [HttpGet]
    [Authorize(Roles = RoleNames.Admin)]
    public IQueryable<FeedbackDto> GetAll()
    {
        return dataContext.Set<Feedback>()
            .Select(x => new FeedbackDto
            {
                Id = x.Id,
                UserId = x.UserId,
                OrderId = x.OrderId,
                Rating = x.Rating,
                Comment = x.Comment,
                CreatedAt = x.CreatedAt
            });
    }

    [HttpGet("my")]
    [Authorize]
    public ActionResult<List<FeedbackDto>> GetMy()
    {
        var userId = User.GetCurrentUserId();

        var results = dataContext.Set<Feedback>()
            .Where(x => x.UserId == userId)
            .Select(x => new FeedbackDto
            {
                Id = x.Id,
                UserId = x.UserId,
                OrderId = x.OrderId,
                Rating = x.Rating,
                Comment = x.Comment,
                CreatedAt = x.CreatedAt
            })
            .ToList();

        return Ok(results);
    }
}
