namespace Selu383.SP26.Api.Features.Auth;

public class UserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string[] Roles { get; set; } = Array.Empty<string>();
    public int Points { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public DateTime? Birthday { get; set; }
    public string ProfilePictureUrl { get; set; } = string.Empty;
}
