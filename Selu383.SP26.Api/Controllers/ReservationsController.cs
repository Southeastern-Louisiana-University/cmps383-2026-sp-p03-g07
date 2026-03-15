using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Reservations;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/reservations")]
public class ReservationsController(DataContext dataContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAll()
    {
        var reservations = await dataContext.Set<Reservation>()
            .Select(x => new ReservationDto
            {
                Id = x.Id,
                UserId = x.UserId,
                LocationId = x.LocationId,
                ReservationTime = x.ReservationTime,
                PartySize = x.PartySize,
                Status = x.Status
            })
            .ToListAsync();

        return Ok(reservations);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReservationDto>> GetById(int id)
    {
        var reservation = await dataContext.Set<Reservation>()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (reservation == null)
        {
            return NotFound();
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

    [HttpPost]
    public async Task<ActionResult<ReservationDto>> Create(ReservationDto dto)
    {
        var reservation = new Reservation
        {
            UserId = dto.UserId,
            LocationId = dto.LocationId,
            ReservationTime = dto.ReservationTime,
            PartySize = dto.PartySize,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Confirmed" : dto.Status
        };

        dataContext.Set<Reservation>().Add(reservation);
        await dataContext.SaveChangesAsync();

        dto.Id = reservation.Id;
        dto.Status = reservation.Status;

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }
}
