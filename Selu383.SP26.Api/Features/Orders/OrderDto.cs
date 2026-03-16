using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Orders;

public class OrderDto
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int LocationId { get; set; }

    [Required]
    public string OrderType { get; set; } = string.Empty;

    public string Status { get; set; } = "Received";

    public int? TableNumber { get; set; }

    public decimal Total { get; set; }

    public DateTime CreatedAt { get; set; }

    public string PickupName { get; set; } = string.Empty;

    public string SpecialInstructions { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = "Pending";

    public int StarsEarned { get; set; }

    public List<OrderItemDto> Items { get; set; } = [];
}
