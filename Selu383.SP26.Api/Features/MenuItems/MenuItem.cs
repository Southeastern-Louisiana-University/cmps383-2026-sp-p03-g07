namespace Selu383.SP26.Api.Features.MenuItems;

public class MenuItem
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public string Category { get; set; } = ""; // Drink/Food/etc
    public bool IsAvailable { get; set; } = true;
}