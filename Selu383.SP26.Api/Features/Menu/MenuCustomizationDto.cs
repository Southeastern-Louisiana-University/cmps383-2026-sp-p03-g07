namespace Selu383.SP26.Api.Features.Menu;

public class MenuCustomizationDto
{
    public int Id { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public string OptionName { get; set; } = string.Empty;

    public decimal AdditionalPrice { get; set; }

    public bool IsDefault { get; set; }

    public int SortOrder { get; set; }
}
