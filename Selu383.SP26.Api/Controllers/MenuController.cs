using Microsoft.AspNetCore.Mvc;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Menu;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/menu")]
public class MenuController(DataContext dataContext) : ControllerBase
{
    [HttpGet]
    public IQueryable<MenuItemDto> GetAll()
    {
        return dataContext.Set<MenuItem>()
            .Select(x => new MenuItemDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                Category = x.Category,
                Price = x.Price,
                IsAvailable = x.IsAvailable,
                LocationId = x.LocationId
            });
    }

    [HttpGet("{id}")]
    public ActionResult<MenuItemDto> GetById(int id)
    {
        var item = dataContext.Set<MenuItem>().FirstOrDefault(x => x.Id == id);

        if (item == null)
        {
            return NotFound();
        }

        return Ok(new MenuItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            Category = item.Category,
            Price = item.Price,
            IsAvailable = item.IsAvailable,
            LocationId = item.LocationId
        });
    }

    [HttpGet("location/{locationId}")]
    public IQueryable<MenuItemDto> GetByLocation(int locationId)
    {
        return dataContext.Set<MenuItem>()
            .Where(x => x.LocationId == locationId)
            .Select(x => new MenuItemDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                Category = x.Category,
                Price = x.Price,
                IsAvailable = x.IsAvailable,
                LocationId = x.LocationId
            });
    }

    [HttpPost]
    public ActionResult<MenuItemDto> Create(MenuItemDto dto)
    {
        var item = new MenuItem
        {
            Name = dto.Name,
            Description = dto.Description,
            Category = dto.Category,
            Price = dto.Price,
            IsAvailable = dto.IsAvailable,
            LocationId = dto.LocationId
        };

        dataContext.Set<MenuItem>().Add(item);
        dataContext.SaveChanges();

        dto.Id = item.Id;

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public ActionResult<MenuItemDto> Update(int id, MenuItemDto dto)
    {
        var item = dataContext.Set<MenuItem>().FirstOrDefault(x => x.Id == id);
        if (item == null) return NotFound();

        item.Name = dto.Name;
        item.Description = dto.Description;
        item.Category = dto.Category;
        item.Price = dto.Price;
        item.IsAvailable = dto.IsAvailable;
        item.LocationId = dto.LocationId;

        dataContext.SaveChanges();

        dto.Id = item.Id;
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public ActionResult Delete(int id)
    {
        var item = dataContext.Set<MenuItem>().FirstOrDefault(x => x.Id == id);
        if (item == null) return NotFound();

        dataContext.Set<MenuItem>().Remove(item);
        dataContext.SaveChanges();

        return NoContent();
    }
}
