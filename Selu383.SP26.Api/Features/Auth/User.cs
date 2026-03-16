using Microsoft.AspNetCore.Identity;

namespace Selu383.SP26.Api.Features.Auth;

public class User : IdentityUser<int>
{
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public int Points { get; set; } = 0;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime? Birthday { get; set; }
    public string ProfilePictureUrl { get; set; } = string.Empty;
}