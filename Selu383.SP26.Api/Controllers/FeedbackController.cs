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
    public ActionResult<FeedbackDto> Create([FromBody] CreateFeedbackDto input)
    {
        if (input.Rating < 1 || input.Rating > 5)
        {
            return BadRequest("Rating must be between 1 and 5.");
        }

        var feedback = new Feedback
        {
            UserId = User.GetCurrentUserId(),
            Name = string.IsNullOrWhiteSpace(input.Name) ? "Anonymous" : input.Name.Trim(),
            Category = string.IsNullOrWhiteSpace(input.Category) ? "Overall" : input.Category.Trim(),
            Rating = input.Rating,
            Comment = string.IsNullOrWhiteSpace(input.Comment) ? string.Empty : input.Comment.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        dataContext.Set<Feedback>().Add(feedback);
        dataContext.SaveChanges();

        return Ok(new FeedbackDto
        {
            Id = feedback.Id,
            UserId = feedback.UserId,
            Name = feedback.Name,
            Category = feedback.Category,
            Rating = feedback.Rating,
            Comment = feedback.Comment,
            CreatedAt = feedback.CreatedAt,
        });
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet]
    public ActionResult<IEnumerable<FeedbackDto>> GetAll()
    {
        var result = dataContext.Set<Feedback>()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new FeedbackDto
            {
                Id = x.Id,
                UserId = x.UserId,
                Name = x.Name,
                Category = x.Category,
                Rating = x.Rating,
                Comment = x.Comment,
                CreatedAt = x.CreatedAt,
            })
            .ToList();

        return Ok(result);
    }
}
