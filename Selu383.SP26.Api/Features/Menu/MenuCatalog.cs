namespace Selu383.SP26.Api.Features.Menu;

public static class MenuCatalog
{
    public static readonly string[] SupportedCategories =
    [
        "Coffee",
        "Matcha",
        "Pastries",
        "Salad & Quiches",
        "Sandwiches & Bagels",
        "Sweet and Pops",
        "Vegan",
        "Gifts"
    ];

    private static readonly Dictionary<string, string> CategoryLookup = SupportedCategories
        .ToDictionary(category => category, StringComparer.OrdinalIgnoreCase);

    public static bool TryNormalizeCategory(string? category, out string normalizedCategory)
    {
        normalizedCategory = string.Empty;

        if (string.IsNullOrWhiteSpace(category))
        {
            return false;
        }

        if (!CategoryLookup.TryGetValue(category.Trim(), out var matchedCategory))
        {
            return false;
        }

        normalizedCategory = matchedCategory;
        return true;
    }

    public static bool IsSupportedCategory(string? category)
    {
        return !string.IsNullOrWhiteSpace(category) && CategoryLookup.ContainsKey(category.Trim());
    }
}
