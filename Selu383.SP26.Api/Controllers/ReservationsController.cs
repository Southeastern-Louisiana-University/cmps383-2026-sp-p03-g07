using Microsoft.AspNetCore.Mvc;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Reservations;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/reservations")]
public class ReservationsController(DataContext dataContext) : ControllerBase
{
    [HttpGet]
    public IQueryable<ReservationDto> GetAll()
    {
        return dataContext.Set<Reservation>()
            .Select(x => new ReservationDto
            {
                Id = x.Id,
                UserId = x.UserId,
                LocationId = x.LocationId,
                ReservationTime = x.ReservationTime,
                PartySize = x.PartySize,
                Status = x.Status
            });
    }

    [HttpGet("{id}")]
    public ActionResult<ReservationDto> GetById(int id)
    {
        var reservation = dataContext.Set<Reservation>().FirstOrDefault(x => x.Id == id);

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
    public ActionResult<ReservationDto> Create(ReservationDto dto)
    {
        var reservation = new Reservation
        {
            UserId = dto.UserId,
            LocationId = dto.LocationId,
            ReservationTime = dto.ReservationTime,
            PartySize = dto.PartySize,
            Status = dto.Status
        };

        dataContext.Set<Reservation>().Add(reservation);
        dataContext.SaveChanges();

        dto.Id = reservation.Id;

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}/status")]
    public ActionResult UpdateStatus(int id, [FromBody] string status)
    {
        var reservation = dataContext.Set<Reservation>().FirstOrDefault(x => x.Id == id);
        if (reservation == null) return NotFound();
        reservation.Status = status;
        dataContext.SaveChanges();
        return Ok();
    }

    [HttpDelete("{id}")]
    public ActionResult Delete(int id)
    {
        var reservation = dataContext.Set<Reservation>().FirstOrDefault(x => x.Id == id);
        if (reservation == null) return NotFound();
        dataContext.Set<Reservation>().Remove(reservation);
        dataContext.SaveChanges();
        return NoContent();
    }
}
