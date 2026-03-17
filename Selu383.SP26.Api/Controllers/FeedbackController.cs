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
        var feedback = new Feedback
        {
            UserId = User.GetCurrentUserId(),
            Name = input.Name.Trim(),
            Category = input.Category,
            Rating = input.Rating,
            Comment = input.Comment.Trim(),
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
