namespace Selu383.SP26.Api.Features.Admin;

public class LowInventoryItemDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int InventoryCount { get; set; }

    public string Category { get; set; } = string.Empty;
}
