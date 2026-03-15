using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Locations;
using Selu383.SP26.Api.Features.Reservations;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/reservations")]
public class ReservationsController(DataContext dataContext) : ControllerBase
{
    [Authorize]
    [HttpGet]
    public ActionResult<IEnumerable<ReservationDto>> GetAll()
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var managedLocationIds = dataContext.Set<Location>()
            .Where(x => x.ManagerId == currentUserId)
            .Select(x => x.Id);

        var reservations = dataContext.Set<Reservation>()
            .Where(x =>
                User.IsInRole(RoleNames.Admin)
                || x.UserId == currentUserId
                || managedLocationIds.Contains(x.LocationId))
            .Select(x => new ReservationDto
            {
                Id = x.Id,
                UserId = x.UserId,
                LocationId = x.LocationId,
                ReservationTime = x.ReservationTime,
                PartySize = x.PartySize,
                Status = x.Status
            })
            .ToList();

        return Ok(reservations);
    }

    [Authorize]
    [HttpGet("{id}")]
    public ActionResult<ReservationDto> GetById(int id)
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        var reservation = dataContext.Set<Reservation>().FirstOrDefault(x => x.Id == id);

        if (reservation == null)
        {
            return NotFound();
        }

        var managesLocation = dataContext.Set<Location>()
            .Any(x => x.Id == reservation.LocationId && x.ManagerId == currentUserId);

        if (!User.IsInRole(RoleNames.Admin) && reservation.UserId != currentUserId && !managesLocation)
        {
            return Forbid();
        }

        return Ok(new ReservationDto
        {
            Id = reservation.Id,
            UserId = reservation.UserId,
            LocationId = reservation.LocationId,
            ReservationTime = reservation.ReservationTime,
            PartySize = reservation.PartySize,
            Status = reservation.Status
        });
    }

    [Authorize]
    [HttpPost]
    public ActionResult<ReservationDto> Create(ReservationDto dto)
    {
        var currentUserId = User.GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized();
        }

        if (dto.PartySize < 1)
        {
            return BadRequest();
        }

        var locationExists = dataContext.Set<Location>().Any(x => x.Id == dto.LocationId);
        if (!locationExists)
        {
            return BadRequest();
        }

        var reservation = new Reservation
        {
            UserId = currentUserId.Value,
            LocationId = dto.LocationId,
            ReservationTime = dto.ReservationTime,
            PartySize = dto.PartySize,
            Status = Reservation.DefaultStatus
        };

        dataContext.Set<Reservation>().Add(reservation);
        dataContext.SaveChanges();

        dto.Id = reservation.Id;
        dto.UserId = reservation.UserId;
        dto.Status = reservation.Status;

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }
}
