namespace Selu383.SP26.Api.Features.Menu;

public class MenuItem
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public bool IsAvailable { get; set; } = true;

    public int LocationId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public int Calories { get; set; }

    public bool IsFeatured { get; set; }

    public int InventoryCount { get; set; } = 25;

    public string PreparationTag { get; set; } = string.Empty;

    public ICollection<MenuCustomization> Customizations { get; set; } = new List<MenuCustomization>();
}
