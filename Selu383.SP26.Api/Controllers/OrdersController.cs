using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Locations;
using Selu383.SP26.Api.Features.Orders;
using Selu383.SP26.Api.Services;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(
    DataContext dataContext,
    PushNotificationService pushNotificationService) : ControllerBase
{
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll()
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var orders = await dataContext.Orders
            .Include(x => x.Items)
            .Where(x => x.UserId == currentUserId && x.Status == "Received")
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(MapDto));
    }

    [Authorize]
    [HttpGet("history")]
    public Task<ActionResult<IEnumerable<OrderDto>>> GetHistory()
    {
        return GetAll();
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var order = await dataContext.Orders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);

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

        return Ok(MapDto(order));
    }

    [Authorize]
    [HttpGet("{id}/track")]
    public Task<ActionResult<OrderDto>> Track(int id)
    {
        return GetById(id);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(OrderDto dto)
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        if (dto.Total < 0)
        {
            return BadRequest();
        }

        if (string.Equals(dto.OrderType, "dine-in", StringComparison.OrdinalIgnoreCase)
            && (!dto.TableNumber.HasValue || dto.TableNumber <= 0))
        {
            return BadRequest();
        }

        var locationExists = await dataContext.Locations.AnyAsync(x => x.Id == dto.LocationId);
        if (!locationExists)
        {
            return BadRequest();
        }

        var resolvedItems = new List<OrderItem>();
        if (dto.Items.Count > 0)
        {
            foreach (var itemDto in dto.Items)
            {
                if (itemDto.Quantity <= 0)
                {
                    return BadRequest();
                }

                var menuItem = await dataContext.MenuItems
                    .FirstOrDefaultAsync(x => x.Id == itemDto.MenuItemId && x.LocationId == dto.LocationId);

                if (menuItem == null)
                {
                    return BadRequest();
                }

                var unitPrice = itemDto.UnitPrice > 0 ? itemDto.UnitPrice : menuItem.Price;
                resolvedItems.Add(new OrderItem
                {
                    MenuItemId = menuItem.Id,
                    ItemName = string.IsNullOrWhiteSpace(itemDto.ItemName) ? menuItem.Name : itemDto.ItemName,
                    Quantity = itemDto.Quantity,
                    UnitPrice = unitPrice,
                    Total = unitPrice * itemDto.Quantity,
                    Customizations = itemDto.Customizations,
                    SpecialInstructions = itemDto.SpecialInstructions
                });
            }
        }

        var total = dto.Total > 0
            ? dto.Total
            : resolvedItems.Sum(x => x.Total);

        if (total <= 0)
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
            Total = total,
            CreatedAt = DateTime.UtcNow,
            PickupName = dto.PickupName,
            SpecialInstructions = dto.SpecialInstructions,
            PaymentStatus = "Pending",
            Items = resolvedItems
        };

        dataContext.Orders.Add(order);
        await dataContext.SaveChangesAsync();

        await pushNotificationService.SendAsync(
            currentUserId.Value,
            "InApp",
            "Order received",
            $"Order #{order.Id} is in the queue for {order.OrderType}.");

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, MapDto(order));
    }

    [Authorize]
    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateStatus(int id, [FromBody] string status)
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

        var order = await dataContext.Orders.FirstOrDefaultAsync(x => x.Id == id);

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
        await dataContext.SaveChangesAsync();

        await pushNotificationService.SendAsync(
            order.UserId,
            "Push",
            "Order update",
            $"Order #{order.Id} is now {status}.");

        return Ok();
    }

    [Authorize]
    [HttpPost("{id}/reorder")]
    public async Task<ActionResult<OrderDto>> Reorder(int id)
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var originalOrder = await dataContext.Orders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == currentUserId);

        if (originalOrder == null)
        {
            return NotFound();
        }

        var newOrder = new Order
        {
            UserId = currentUserId.Value,
            LocationId = originalOrder.LocationId,
            OrderType = originalOrder.OrderType,
            Status = Order.DefaultStatus,
            TableNumber = originalOrder.TableNumber,
            Total = originalOrder.Total,
            PickupName = originalOrder.PickupName,
            SpecialInstructions = originalOrder.SpecialInstructions,
            Items = originalOrder.Items.Select(x => new OrderItem
            {
                MenuItemId = x.MenuItemId,
                ItemName = x.ItemName,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice,
                Total = x.Total,
                Customizations = x.Customizations,
                SpecialInstructions = x.SpecialInstructions
            }).ToList()
        };

        dataContext.Orders.Add(newOrder);
        await dataContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = newOrder.Id }, MapDto(newOrder));
    }

    private static OrderDto MapDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            LocationId = order.LocationId,
            OrderType = order.OrderType,
            Status = order.Status,
            TableNumber = order.TableNumber,
            Total = order.Total,
            CreatedAt = order.CreatedAt,
            PickupName = order.PickupName,
            SpecialInstructions = order.SpecialInstructions,
            PaymentStatus = order.PaymentStatus,
            StarsEarned = order.StarsEarned,
            Items = order.Items
                .Select(x => new OrderItemDto
                {
                    Id = x.Id,
                    MenuItemId = x.MenuItemId,
                    ItemName = x.ItemName,
                    Quantity = x.Quantity,
                    UnitPrice = x.UnitPrice,
                    Total = x.Total,
                    Customizations = x.Customizations,
                    SpecialInstructions = x.SpecialInstructions
                })
                .ToList()
        };
    }
}
