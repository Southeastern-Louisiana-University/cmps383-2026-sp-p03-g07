using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Orders;
using Selu383.SP26.Api.Features.Rewards;
using Microsoft.EntityFrameworkCore;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(DataContext dataContext) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<OrderDto>>> GetAll()
    {
        var userName = User.GetCurrentUserName();
        var user = await dataContext.Set<User>().FirstOrDefaultAsync(u => u.UserName == userName);
        if (user == null) return Unauthorized();

        var isAdmin = User.IsInRole(RoleNames.Admin);

        var query = dataContext.Set<Order>().Include(o => o.Items).AsQueryable();
        if (!isAdmin)
            query = query.Where(x => x.UserId == user.Id);

        var orders = await query.OrderByDescending(x => x.Id).Select(x => new OrderDto
        {
            Id = x.Id,
            UserId = x.UserId,
            LocationId = x.LocationId,
            OrderType = x.OrderType,
            Status = x.Status,
            TableNumber = x.TableNumber,
            Total = x.Total,
            DiscountAmount = x.DiscountAmount,
            RedemptionId = x.RedemptionId,
            Note = x.Note,
            Items = x.Items.Select(i => new OrderItemDto
            {
                MenuItemId = i.MenuItemId,
                Name = i.Name,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        }).ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await dataContext.Set<Order>().Include(o => o.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (order == null) return NotFound();

        return Ok(new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            LocationId = order.LocationId,
            OrderType = order.OrderType,
            Status = order.Status,
            TableNumber = order.TableNumber,
            Total = order.Total,
            DiscountAmount = order.DiscountAmount,
            RedemptionId = order.RedemptionId,
            Note = order.Note,
            Items = order.Items.Select(i => new OrderItemDto
            {
                MenuItemId = i.MenuItemId,
                Name = i.Name,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        });
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(OrderDto dto)
    {
        // Use the authenticated user's ID if logged in, otherwise use guest (0)
        int resolvedUserId = dto.UserId;
        var userName = User.GetCurrentUserName();
        if (!string.IsNullOrEmpty(userName))
        {
            var currentUser = await dataContext.Set<User>().FirstOrDefaultAsync(u => u.UserName == userName);
            if (currentUser != null) resolvedUserId = currentUser.Id;
        }

        decimal discountAmount = 0;

        if (dto.RedemptionId.HasValue)
        {
            var redemption = await dataContext.Set<RewardRedemption>()
                .Include(r => r.Reward)
                .FirstOrDefaultAsync(r => r.Id == dto.RedemptionId.Value && !r.IsUsed);

            if (redemption?.Reward != null)
            {
                if (redemption.Reward.RewardType == "discount")
                    discountAmount = Math.Round(dto.Total * (redemption.Reward.DiscountValue / 100), 2);

                redemption.IsUsed = true;
            }
        }

        var finalTotal = dto.Total - discountAmount;

        var order = new Order
        {
            UserId = resolvedUserId,
            LocationId = dto.LocationId,
            OrderType = dto.OrderType,
            Status = "Received",
            TableNumber = dto.TableNumber,
            Total = finalTotal,
            DiscountAmount = discountAmount,
            RedemptionId = dto.RedemptionId,
            Note = dto.Note
        };

        dataContext.Set<Order>().Add(order);
        await dataContext.SaveChangesAsync();

        foreach (var item in dto.Items)
        {
            dataContext.Set<OrderItem>().Add(new OrderItem
            {
                OrderId = order.Id,
                MenuItemId = item.MenuItemId,
                Name = item.Name,
                Quantity = item.Quantity,
                Price = item.Price
            });
        }

        await dataContext.SaveChangesAsync();

        dto.Id = order.Id;
        dto.Total = finalTotal;
        dto.DiscountAmount = discountAmount;
        dto.Status = order.Status;

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}/status")]
    [Authorize]
    public async Task<ActionResult> UpdateStatus(int id, [FromBody] string status)
    {
        var order = await dataContext.Set<Order>().FirstOrDefaultAsync(x => x.Id == id);
        if (order == null) return NotFound();

        order.Status = status;
        await dataContext.SaveChangesAsync();

        return Ok();
    }
}
