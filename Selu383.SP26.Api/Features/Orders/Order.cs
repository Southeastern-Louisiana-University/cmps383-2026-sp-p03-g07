namespace Selu383.SP26.Api.Features.Orders;

public class Order
{
    public const string DefaultStatus = "Received";

    public int Id { get; set; }

    public int UserId { get; set; }

    public int LocationId { get; set; }

    public string OrderType { get; set; } = string.Empty; // dine-in, pickup, drive-thru

    public string Status { get; set; } = DefaultStatus;

    public int? TableNumber { get; set; }

    public decimal Total { get; set; }
}
