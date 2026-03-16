using Microsoft.AspNetCore.Identity;

namespace Selu383.SP26.Api.Features.Auth;

public class UserRole : IdentityUserRole<int>
{
    public virtual required Role Role { get; set; }
    public virtual required User User { get; set; }
}
