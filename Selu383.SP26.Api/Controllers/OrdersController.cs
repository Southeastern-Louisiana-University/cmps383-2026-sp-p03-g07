using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Locations;
using Selu383.SP26.Api.Features.Orders;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(DataContext dataContext) : ControllerBase
{
    [Authorize]
    [HttpGet]
    public ActionResult<IEnumerable<OrderDto>> GetAll()
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var managedLocationIds = dataContext.Set<Location>()
            .Where(x => x.ManagerId == currentUserId)
            .Select(x => x.Id);

        var orders = dataContext.Set<Order>()
            .Where(x =>
                User.IsInRole(RoleNames.Admin)
                || x.UserId == currentUserId
                || managedLocationIds.Contains(x.LocationId))
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
            .ToList();

        return Ok(orders);
    }

    [Authorize]
    [HttpGet("{id}")]
    public ActionResult<OrderDto> GetById(int id)
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var order = dataContext.Set<Order>().FirstOrDefault(x => x.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        var managesLocation = dataContext.Set<Location>()
            .Any(x => x.Id == order.LocationId && x.ManagerId == currentUserId);

        if (!User.IsInRole(RoleNames.Admin) && order.UserId != currentUserId && !managesLocation)
        {
            return Forbid();
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

    [Authorize]
    [HttpPost]
    public ActionResult<OrderDto> Create(OrderDto dto)
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        if (dto.Total < 0 || dto.TableNumber <= 0)
        {
            return BadRequest();
        }

        var locationExists = dataContext.Set<Location>().Any(x => x.Id == dto.LocationId);
        if (!locationExists)
        {
            return BadRequest();
        }

        var order = new Order
        {
            UserId = currentUserId.Value,
            LocationId = dto.LocationId,
            OrderType = dto.OrderType,
            Status = Order.DefaultStatus,
            TableNumber = dto.TableNumber,
            Total = dto.Total
        };

        dataContext.Set<Order>().Add(order);
        dataContext.SaveChanges();

        dto.Id = order.Id;
        dto.UserId = order.UserId;
        dto.Status = order.Status;

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [Authorize]
    [HttpPut("{id}/status")]
    public ActionResult UpdateStatus(int id, [FromBody] string status)
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(status))
        {
            return BadRequest();
        }

        var order = dataContext.Set<Order>().FirstOrDefault(x => x.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        var managesLocation = dataContext.Set<Location>()
            .Any(x => x.Id == order.LocationId && x.ManagerId == currentUserId);

        if (!User.IsInRole(RoleNames.Admin) && !managesLocation)
        {
            return Forbid();
        }

        order.Status = status;
        dataContext.SaveChanges();

        return Ok();
    }
}
