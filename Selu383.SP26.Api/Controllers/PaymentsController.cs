using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Payments;
using Selu383.SP26.Api.Services;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController(
    DataContext dataContext,
    PaymentService paymentService) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetMine()
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var isAdmin = User.IsInRole(RoleNames.Admin);

        var payments = await dataContext.Payments
            .Where(x => isAdmin || x.UserId == currentUserId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new PaymentDto
            {
                Id = x.Id,
                UserId = x.UserId,
                OrderId = x.OrderId,
                Amount = x.Amount,
                Method = x.Method,
                Status = x.Status,
                ProviderReference = x.ProviderReference,
                CardLastFour = x.CardLastFour,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return Ok(payments);
    }

    [AllowAnonymous]
    [HttpPost("checkout")]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> Checkout(CheckoutPaymentDto dto)
    {
        var currentUserId = User.GetCurrentUserId();

        try
        {
            var payments = await paymentService.ProcessOrderPaymentAsync(currentUserId, dto);
            return Ok(payments.Select(x => new PaymentDto
            {
                Id = x.Id,
                UserId = x.UserId,
                OrderId = x.OrderId,
                Amount = x.Amount,
                Method = x.Method,
                Status = x.Status,
                ProviderReference = x.ProviderReference,
                CardLastFour = x.CardLastFour,
                CreatedAt = x.CreatedAt
            }));
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
}
