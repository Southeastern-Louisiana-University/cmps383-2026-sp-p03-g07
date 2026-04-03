using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Auth;

public class UpdateProfileDto
{
    public string? DisplayName { get; set; }
    [EmailAddress]
    public string? Email { get; set; }
    [Phone]
    public string? PhoneNumber { get; set; }
    public DateTime? Birthday { get; set; }
    public string? ProfilePictureUrl { get; set; }
}
