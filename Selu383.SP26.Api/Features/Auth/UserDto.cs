namespace Selu383.SP26.Api.Features.Auth;

public class UserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string[] Roles { get; set; } = Array.Empty<string>();
    public string? DisplayName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public DateTime? Birthday { get; set; }
    public bool IsBirthday { get; set; }
}