using Microsoft.AspNetCore.Identity;

namespace Selu383.SP26.Api.Features.Auth;

public class User : IdentityUser<int>
{
    public string? DisplayName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public DateTime? Birthday { get; set; }
    public bool BirthdayRewardClaimedYear { get; set; } = false;
    public int? BirthdayRewardClaimedForYear { get; set; }

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}