using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Reservations;

public class ReservationDto
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int LocationId { get; set; }

    [Required]
    public DateTime ReservationTime { get; set; }

    public int PartySize { get; set; }

    public string Status { get; set; } = "Confirmed";
}
