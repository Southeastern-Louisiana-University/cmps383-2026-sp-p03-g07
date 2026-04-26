using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/authentication")]
public class AuthenticationController : ControllerBase
{
    private readonly SignInManager<User> signInManager;
    private readonly UserManager<User> userManager;

    public AuthenticationController(
        SignInManager<User> signInManager,
        UserManager<User> userManager)
    {
        this.signInManager = signInManager;
        this.userManager = userManager;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var username = User.GetCurrentUserName();
        if (string.IsNullOrWhiteSpace(username))
        {
            return Unauthorized();
        }

        var resultDto = await GetUserDto(userManager.Users).SingleOrDefaultAsync(x => x.UserName == username);
        if (resultDto == null)
        {
            return NotFound();
        }

        return Ok(resultDto);
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto dto)
    {
        if (await userManager.FindByNameAsync(dto.UserName) != null)
        {
            return BadRequest("Username is already taken.");
        }

        var user = new User
        {
            UserName = dto.UserName,
            Email = dto.Email,
            PhoneNumber = dto.Phone
        };

        var createResult = await userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join(" ", createResult.Errors.Select(e => e.Description));
            return BadRequest(errors);
        }

        await userManager.AddToRoleAsync(user, RoleNames.User);
        await signInManager.SignInAsync(user, false);

        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.Id == user.Id);
        return Ok(resultDto);
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto dto)
    {
        var user = await userManager.FindByNameAsync(dto.UserName);
        if (user == null)
        {
            return BadRequest("Invalid username or password.");
        }
        var result = await signInManager.CheckPasswordSignInAsync(user, dto.Password, true);
        if (!result.Succeeded)
        {
            return BadRequest("Invalid username or password.");
        }

        await signInManager.SignInAsync(user, false);

        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.UserName == user.UserName);
        return Ok(resultDto);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok();
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var user = await userManager.FindByNameAsync(dto.UserName);
        if (user == null)
        {
            return BadRequest("No account found with that username.");
        }

        var emailMatches = string.Equals(
            (user.Email ?? string.Empty).Trim(),
            dto.Email.Trim(),
            StringComparison.OrdinalIgnoreCase);
        var phoneMatches = string.Equals(
            NormalizePhone(user.PhoneNumber ?? string.Empty),
            NormalizePhone(dto.Phone),
            StringComparison.Ordinal);

        if (!emailMatches || !phoneMatches)
        {
            return BadRequest("Email or phone number does not match our records.");
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await userManager.ResetPasswordAsync(user, token, dto.NewPassword);
        if (!resetResult.Succeeded)
        {
            var errors = string.Join(" ", resetResult.Errors.Select(e => e.Description));
            return BadRequest(errors);
        }

        await userManager.ResetAccessFailedCountAsync(user);
        await userManager.SetLockoutEndDateAsync(user, null);

        return Ok();
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var username = User.GetCurrentUserName();
        if (string.IsNullOrWhiteSpace(username))
        {
            return Unauthorized();
        }

        var user = await userManager.FindByNameAsync(username);
        if (user == null)
        {
            return NotFound();
        }

        user.DisplayName = dto.DisplayName ?? user.DisplayName;
        user.Birthday = dto.Birthday ?? user.Birthday;
        user.ProfilePictureUrl = dto.ProfilePictureUrl ?? user.ProfilePictureUrl;

        await userManager.UpdateAsync(user);

        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.Id == user.Id);
        return Ok(resultDto);
    }

    private static IQueryable<UserDto> GetUserDto(IQueryable<User> users)
    {
        return users.Select(x => new UserDto
        {
            Id = x.Id,
            UserName = x.UserName!,
            Roles = x.UserRoles.Select(y => y.Role!.Name).ToArray()!,
            Points = x.Points,
            DisplayName = x.DisplayName,
            Birthday = x.Birthday,
            ProfilePictureUrl = x.ProfilePictureUrl
        });
    }

    private static string NormalizePhone(string value)
    {
        return new string(value.Where(char.IsDigit).ToArray());
    }
}
