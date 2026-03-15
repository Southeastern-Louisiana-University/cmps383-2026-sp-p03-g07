using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Locations;
using Selu383.SP26.Api.Features.Menu;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/menu")]
public class MenuController(DataContext dataContext) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await dataContext.MenuItems
            .Select(x => x.Category)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MenuItemDto>>> GetAll(
        [FromQuery] int? locationId,
        [FromQuery] string? category,
        [FromQuery] string? search)
    {
        var query = dataContext.MenuItems
            .Include(x => x.Customizations)
            .AsQueryable();

        if (locationId != null)
        {
            query = query.Where(x => x.LocationId == locationId);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(x => x.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x =>
                x.Name.Contains(search)
                || x.Description.Contains(search)
                || x.PreparationTag.Contains(search));
        }

        var items = await query
            .OrderByDescending(x => x.IsFeatured)
            .ThenBy(x => x.Category)
            .ThenBy(x => x.Name)
            .ToListAsync();

        return Ok(items.Select(MapDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MenuItemDto>> GetById(int id)
    {
        var item = await dataContext.MenuItems
            .Include(x => x.Customizations)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (item == null)
        {
            return NotFound();
        }

        return Ok(MapDto(item));
    }

    [HttpGet("location/{locationId:int}")]
    public async Task<ActionResult<IEnumerable<MenuItemDto>>> GetByLocation(int locationId)
    {
        return await GetAll(locationId, null, null);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<MenuItemDto>> Create(MenuItemDto dto)
    {
        if (dto.Price < 0 || dto.InventoryCount < 0)
        {
            return BadRequest();
        }

        var location = await dataContext.Locations.FirstOrDefaultAsync(x => x.Id == dto.LocationId);
        if (location == null)
        {
            return BadRequest();
        }

        if (!User.IsInRole(RoleNames.Admin) && User.GetCurrentUserId() != location.ManagerId)
        {
            return Forbid();
        }

        var item = MapEntity(dto);

        dataContext.MenuItems.Add(item);
        await dataContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, MapDto(item));
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<ActionResult<MenuItemDto>> Update(int id, MenuItemDto dto)
    {
        if (dto.Price < 0 || dto.InventoryCount < 0)
        {
            return BadRequest();
        }

        var item = await dataContext.MenuItems
            .Include(x => x.Customizations)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (item == null)
        {
            return NotFound();
        }

        var location = await dataContext.Locations.FirstAsync(x => x.Id == item.LocationId);
        if (!User.IsInRole(RoleNames.Admin) && User.GetCurrentUserId() != location.ManagerId)
        {
            return Forbid();
        }

        item.Name = dto.Name;
        item.Category = dto.Category;
        item.Description = dto.Description;
        item.Price = dto.Price;
        item.IsAvailable = dto.IsAvailable;
        item.ImageUrl = dto.ImageUrl;
        item.Calories = dto.Calories;
        item.IsFeatured = dto.IsFeatured;
        item.InventoryCount = dto.InventoryCount;
        item.PreparationTag = dto.PreparationTag;

        item.Customizations.Clear();
        foreach (var customization in dto.Customizations.OrderBy(x => x.SortOrder))
        {
            item.Customizations.Add(new MenuCustomization
            {
                GroupName = customization.GroupName,
                OptionName = customization.OptionName,
                AdditionalPrice = customization.AdditionalPrice,
                IsDefault = customization.IsDefault,
                SortOrder = customization.SortOrder
            });
        }

        await dataContext.SaveChangesAsync();
        return Ok(MapDto(item));
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<ActionResult> Delete(int id)
    {
        var item = await dataContext.MenuItems.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null)
        {
            return NotFound();
        }

        var location = await dataContext.Locations.FirstAsync(x => x.Id == item.LocationId);
        if (!User.IsInRole(RoleNames.Admin) && User.GetCurrentUserId() != location.ManagerId)
        {
            return Forbid();
        }

        dataContext.MenuItems.Remove(item);
        await dataContext.SaveChangesAsync();
        return Ok();
    }

    private static MenuItem MapEntity(MenuItemDto dto)
    {
        return new MenuItem
        {
            Name = dto.Name,
            Category = dto.Category,
            Description = dto.Description,
            Price = dto.Price,
            IsAvailable = dto.IsAvailable,
            LocationId = dto.LocationId,
            ImageUrl = dto.ImageUrl,
            Calories = dto.Calories,
            IsFeatured = dto.IsFeatured,
            InventoryCount = dto.InventoryCount,
            PreparationTag = dto.PreparationTag,
            Customizations = dto.Customizations
                .OrderBy(x => x.SortOrder)
                .Select(x => new MenuCustomization
                {
                    GroupName = x.GroupName,
                    OptionName = x.OptionName,
                    AdditionalPrice = x.AdditionalPrice,
                    IsDefault = x.IsDefault,
                    SortOrder = x.SortOrder
                })
                .ToList()
        };
    }

    private static MenuItemDto MapDto(MenuItem item)
    {
        return new MenuItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Category = item.Category,
            Description = item.Description,
            Price = item.Price,
            IsAvailable = item.IsAvailable,
            LocationId = item.LocationId,
            ImageUrl = item.ImageUrl,
            Calories = item.Calories,
            IsFeatured = item.IsFeatured,
            InventoryCount = item.InventoryCount,
            PreparationTag = item.PreparationTag,
            Customizations = item.Customizations
                .OrderBy(x => x.SortOrder)
                .Select(x => new MenuCustomizationDto
                {
                    Id = x.Id,
                    GroupName = x.GroupName,
                    OptionName = x.OptionName,
                    AdditionalPrice = x.AdditionalPrice,
                    IsDefault = x.IsDefault,
                    SortOrder = x.SortOrder
                })
                .ToList()
        };
    }
}
