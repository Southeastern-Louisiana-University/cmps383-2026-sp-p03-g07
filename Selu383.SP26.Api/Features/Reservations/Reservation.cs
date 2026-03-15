namespace Selu383.SP26.Api.Features.Reservations;

public class Reservation
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int LocationId { get; set; }

    public DateTime ReservationTime { get; set; }

    public int PartySize { get; set; }

    public string Status { get; set; } = "Confirmed";
}
