namespace Selu383.SP26.Api.Features.MenuItems;

public class CreateMenuItemDto
{
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public string Category { get; set; } = "";
}