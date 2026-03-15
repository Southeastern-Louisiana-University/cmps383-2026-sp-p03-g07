using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Menu;

public class MenuItemDto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public bool IsAvailable { get; set; }

    public int LocationId { get; set; }
}
