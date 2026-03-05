using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;

namespace Selu383.SP26.Api.Features.MenuItems;

[Route("api/menu-items")]
[ApiController]
public class MenuItemsController(DataContext dataContext) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<List<MenuItemDto>> GetAll()
    {
        return await dataContext.Set<MenuItem>()
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Name)
            .Select(x => new MenuItemDto
            {
                Id = x.Id,
                Name = x.Name,
                Price = x.Price,
                Category = x.Category,
                IsAvailable = x.IsAvailable
            })
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<MenuItemDto>> GetById(int id)
    {
        var entity = await dataContext.Set<MenuItem>().FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return NotFound();

        return Ok(new MenuItemDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Price = entity.Price,
            Category = entity.Category,
            IsAvailable = entity.IsAvailable
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MenuItemDto>> Create(CreateMenuItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest("Name is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            return BadRequest("Category is required.");
        }

        if (dto.Price < 0)
        {
            return BadRequest("Price must be >= 0.");
        }

        var entity = new MenuItem
        {
            Name = dto.Name.Trim(),
            Price = dto.Price,
            Category = dto.Category.Trim(),
            IsAvailable = true
        };

        dataContext.Add(entity);
        await dataContext.SaveChangesAsync();

        var result = new MenuItemDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Price = entity.Price,
            Category = entity.Category,
            IsAvailable = entity.IsAvailable
        };

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, result);
    }
}