using System.Text;
using System.Text.RegularExpressions;

namespace Selu383.SP26.Api.Services;

public static partial class InputSanitizer
{
    public static string CleanSingleLine(string? value, int maxLength)
    {
        return Truncate(CollapseWhitespace(RemoveHtmlAndControls(value)), maxLength);
    }

    public static string CleanMultiline(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var sanitized = RemoveHtmlAndControls(value)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace('\r', '\n');

        var cleanedLines = sanitized
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(CollapseWhitespace)
            .Where(line => !string.IsNullOrWhiteSpace(line));

        return Truncate(string.Join('\n', cleanedLines), maxLength);
    }

    public static string NormalizeEmail(string? value, int maxLength = 256)
    {
        return CleanSingleLine(value, maxLength).ToLowerInvariant();
    }

    public static string NormalizePhone(string? value, int maxLength = 32)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var cleanedValue = CleanSingleLine(value, maxLength);
        var builder = new StringBuilder(cleanedValue.Length);

        foreach (var character in cleanedValue)
        {
            if (char.IsDigit(character) || (character == '+' && builder.Length == 0))
            {
                builder.Append(character);
            }
        }

        return Truncate(builder.ToString(), maxLength);
    }

    private static string RemoveHtmlAndControls(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var withoutHtml = HtmlTagRegex().Replace(value.Normalize(), " ");
        var builder = new StringBuilder(withoutHtml.Length);

        foreach (var character in withoutHtml)
        {
            if (!char.IsControl(character) || character == '\n' || character == '\r' || character == '\t')
            {
                builder.Append(character);
            }
        }

        return builder.ToString();
    }

    private static string CollapseWhitespace(string value)
    {
        return WhitespaceRegex().Replace(value, " ").Trim();
    }

    private static string Truncate(string value, int maxLength)
    {
        if (value.Length <= maxLength)
        {
            return value;
        }

        return value[..maxLength].Trim();
    }

    [GeneratedRegex("<[^>]*>", RegexOptions.Compiled)]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"\s+", RegexOptions.Compiled)]
    private static partial Regex WhitespaceRegex();
}
