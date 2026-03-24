using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Locations;

namespace Selu383.SP26.Api.Controllers;

[Route("api/locations")]
[ApiController]
public class LocationsController(DataContext dataContext) : ControllerBase
{
    [HttpGet]
    public IQueryable<LocationDto> GetAll()
    {
        return dataContext.Set<Location>()
            .Select(x => new LocationDto
            {
                Id = x.Id,
                Name = x.Name,
                Address = x.Address,
                TableCount = x.TableCount,
                ManagerId = x.ManagerId,
            });
    }

    [HttpGet("{id}")]
    public ActionResult<LocationDto> GetById(int id)
    {
        var result = dataContext.Set<Location>()
            .FirstOrDefault(x => x.Id == id);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(new LocationDto
        {
            Id = result.Id,
            Name = result.Name,
            Address = result.Address,
            TableCount = result.TableCount,
            ManagerId = result.ManagerId,
        });
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Admin)]
    public ActionResult<LocationDto> Create(LocationDto dto)
    {
        if (dto.TableCount < 1 || string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Address))
        {
            return BadRequest("Name, address, and table count are required.");
        }

        if (dto.ManagerId != null && !dataContext.Set<User>().Any(x => x.Id == dto.ManagerId))
        {
            return BadRequest("Manager user was not found.");
        }

        var location = new Location
        {
            Name = dto.Name.Trim(),
            Address = dto.Address.Trim(),
            TableCount = dto.TableCount,
            ManagerId = dto.ManagerId
        };

        dataContext.Set<Location>().Add(location);
        dataContext.SaveChanges();

        dto.Id = location.Id;

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize]
    public ActionResult<LocationDto> Update(int id, LocationDto dto)
    {
        if (dto.TableCount < 1 || string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Address))
        {
            return BadRequest("Name, address, and table count are required.");
        }

        var location = dataContext.Set<Location>()
            .FirstOrDefault(x => x.Id == id);

        if (location == null)
        {
            return NotFound();
        }

        if (!User.IsInRole(RoleNames.Admin) && User.GetCurrentUserId() != location.ManagerId)
        {
            return Forbid();
        }

        if (User.IsInRole(RoleNames.Admin))
        {
            if (dto.ManagerId != null && !dataContext.Set<User>().Any(x => x.Id == dto.ManagerId))
            {
                return BadRequest("Manager user was not found.");
            }

            location.ManagerId = dto.ManagerId;
        }

        location.Name = dto.Name.Trim();
        location.Address = dto.Address.Trim();
        location.TableCount = dto.TableCount;

        dataContext.SaveChanges();

        dto.Id = location.Id;
        dto.ManagerId = location.ManagerId;

        return Ok(dto);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public ActionResult Delete(int id)
    {
        var location = dataContext.Set<Location>()
            .FirstOrDefault(x => x.Id == id);

        if (location == null)
        {
            return NotFound();
        }

        if (!User.IsInRole(RoleNames.Admin) && User.GetCurrentUserId() != location.ManagerId)
        {
            return Forbid();
        }

        dataContext.Set<Location>().Remove(location);

        try
        {
            dataContext.SaveChanges();
        }
        catch (DbUpdateException)
        {
            return Conflict("This location is still referenced by orders or reservations.");
        }

        return Ok();
    }
}
