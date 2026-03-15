namespace Selu383.SP26.Api.Features.Orders;

public class OrderItemDto
{
    public int MenuItemId { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal Price { get; set; }
}
