using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Orders;
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

        var orders = await dataContext.Set<Order>()
            .Where(x => x.UserId == user.Id)
            .Select(x => new OrderDto
            {
                Id = x.Id,
                UserId = x.UserId,
                LocationId = x.LocationId,
                OrderType = x.OrderType,
                Status = x.Status,
                TableNumber = x.TableNumber,
                Total = x.Total
            }).ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{id}")]
    public ActionResult<OrderDto> GetById(int id)
    {
        var order = dataContext.Set<Order>().FirstOrDefault(x => x.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        return Ok(new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            LocationId = order.LocationId,
            OrderType = order.OrderType,
            Status = order.Status,
            TableNumber = order.TableNumber,
            Total = order.Total
        });
    }

    [HttpPost]
    public ActionResult<OrderDto> Create(OrderDto dto)
    {
        var order = new Order
        {
            UserId = dto.UserId,
            LocationId = dto.LocationId,
            OrderType = dto.OrderType,
            Status = dto.Status,
            TableNumber = dto.TableNumber,
            Total = dto.Total
        };

        dataContext.Set<Order>().Add(order);
        dataContext.SaveChanges();

        dto.Id = order.Id;

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}/status")]
    public ActionResult UpdateStatus(int id, [FromBody] string status)
    {
        var order = dataContext.Set<Order>().FirstOrDefault(x => x.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        order.Status = status;
        dataContext.SaveChanges();

        return Ok();
    }
}
