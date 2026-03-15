using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
                City = x.City,
                State = x.State,
                Zip = x.Zip,
                Phone = x.Phone,
                HoursOfOperation = x.HoursOfOperation,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
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
            City = result.City,
            State = result.State,
            Zip = result.Zip,
            Phone = result.Phone,
            HoursOfOperation = result.HoursOfOperation,
            Latitude = result.Latitude,
            Longitude = result.Longitude,
            TableCount = result.TableCount,
            ManagerId = result.ManagerId,
        });
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Admin)]
    public ActionResult<LocationDto> Create(LocationDto dto)
    {
        if (dto.TableCount < 1)
        {
            return BadRequest();
        }

        var location = new Location
        {
            Name = dto.Name,
            Address = dto.Address,
            City = dto.City,
            State = dto.State,
            Zip = dto.Zip,
            Phone = dto.Phone,
            HoursOfOperation = dto.HoursOfOperation,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
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
        if (dto.TableCount < 1)
        {
            return BadRequest();
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

        location.Name = dto.Name;
        location.Address = dto.Address;
        location.City = dto.City;
        location.State = dto.State;
        location.Zip = dto.Zip;
        location.Phone = dto.Phone;
        location.HoursOfOperation = dto.HoursOfOperation;
        location.Latitude = dto.Latitude;
        location.Longitude = dto.Longitude;
        location.TableCount = dto.TableCount;
        location.ManagerId = dto.ManagerId;

        dataContext.SaveChanges();

        dto.Id = location.Id;

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
        dataContext.SaveChanges();

        return Ok();
    }
}
