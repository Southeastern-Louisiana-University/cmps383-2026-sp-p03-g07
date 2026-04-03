namespace Selu383.SP26.Tests.Dtos;

internal class UserDto : PasswordGuard
{
    public int Id { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string[]? Roles { get; set; }
    public int Points { get; set; }
}
