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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string PickupName { get; set; } = string.Empty;

    public string SpecialInstructions { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = "Pending";

    public int StarsEarned { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
