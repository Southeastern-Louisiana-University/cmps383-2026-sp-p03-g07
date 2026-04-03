using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Services;

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
        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.UserName == username);
        return Ok(resultDto);
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto dto)
    {
        var normalizedUserName = InputSanitizer.CleanSingleLine(dto.UserName, 64);
        var normalizedEmail = InputSanitizer.NormalizeEmail(dto.Email);
        var normalizedPhoneNumber = InputSanitizer.NormalizePhone(dto.PhoneNumber);

        if (string.IsNullOrWhiteSpace(normalizedUserName))
        {
            return BadRequest("Username is required.");
        }

        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return BadRequest("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(normalizedPhoneNumber))
        {
            return BadRequest("Phone number is required.");
        }

        if (await userManager.FindByNameAsync(normalizedUserName) != null)
        {
            return BadRequest("Username is already taken.");
        }

        if (await userManager.FindByEmailAsync(normalizedEmail) != null)
        {
            return BadRequest("Email is already in use.");
        }

        var user = new User
        {
            UserName = normalizedUserName,
            DisplayName = normalizedUserName,
            Email = normalizedEmail,
            PhoneNumber = normalizedPhoneNumber
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
        var normalizedUserName = InputSanitizer.CleanSingleLine(dto.UserName, 64);
        var user = await userManager.FindByNameAsync(normalizedUserName);
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

        if (dto.Email != null)
        {
            var normalizedEmail = InputSanitizer.NormalizeEmail(dto.Email);
            var emailOwner = await userManager.Users
                .Where(x => x.Id != user.Id)
                .AnyAsync(x => x.Email == normalizedEmail);

            if (emailOwner)
            {
                return BadRequest("Email is already in use.");
            }

            user.Email = normalizedEmail;
        }

        if (dto.PhoneNumber != null)
        {
            user.PhoneNumber = InputSanitizer.NormalizePhone(dto.PhoneNumber);
        }

        if (dto.DisplayName != null)
        {
            user.DisplayName = InputSanitizer.CleanSingleLine(dto.DisplayName, 80);
        }

        user.Birthday = dto.Birthday ?? user.Birthday;

        if (dto.ProfilePictureUrl != null)
        {
            user.ProfilePictureUrl = InputSanitizer.CleanSingleLine(dto.ProfilePictureUrl, 1024);
        }

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
            Email = x.Email ?? string.Empty,
            PhoneNumber = x.PhoneNumber ?? string.Empty,
            Roles = x.UserRoles.Select(y => y.Role!.Name).ToArray()!,
            Points = x.Points,
            DisplayName = x.DisplayName,
            Birthday = x.Birthday,
            ProfilePictureUrl = x.ProfilePictureUrl
        });
    }
}
