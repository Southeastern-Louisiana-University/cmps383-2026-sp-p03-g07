using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Orders;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(DataContext dataContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll()
    {
        var orders = await dataContext.Set<Order>()
            .Select(x => new OrderDto
            {
                Id = x.Id,
                UserId = x.UserId,
                LocationId = x.LocationId,
                OrderType = x.OrderType,
                Status = x.Status,
                TableNumber = x.TableNumber,
                Total = x.Total
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await dataContext.Set<Order>()
            .FirstOrDefaultAsync(x => x.Id == id);

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
    public async Task<ActionResult<OrderDto>> Create(OrderDto dto)
    {
        var order = new Order
        {
            UserId = dto.UserId,
            LocationId = dto.LocationId,
            OrderType = dto.OrderType,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Received" : dto.Status,
            TableNumber = dto.TableNumber,
            Total = dto.Total
        };

        dataContext.Set<Order>().Add(order);
        await dataContext.SaveChangesAsync();

        dto.Id = order.Id;
        dto.Status = order.Status;

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateStatus(int id, [FromBody] string status)
    {
        var order = await dataContext.Set<Order>()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        order.Status = status;
        await dataContext.SaveChangesAsync();

        return Ok();
    }
}
