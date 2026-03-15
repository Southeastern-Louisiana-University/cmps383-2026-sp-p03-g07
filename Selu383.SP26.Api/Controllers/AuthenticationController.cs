using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Rewards;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/authentication")]
public class AuthenticationController : ControllerBase
{
    private readonly SignInManager<User> signInManager;
    private readonly UserManager<User> userManager;
    private readonly DataContext dataContext;

    public AuthenticationController(
        SignInManager<User> signInManager,
        UserManager<User> userManager,
        DataContext dataContext)
    {
        this.signInManager = signInManager;
        this.userManager = userManager;
        this.dataContext = dataContext;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var username = User.GetCurrentUserName();
        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.UserName == username);
        return Ok(resultDto);
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto dto)
    {
        var user = await userManager.FindByNameAsync(dto.UserName);
        if (user == null)
        {
            return BadRequest();
        }
        var result = await signInManager.CheckPasswordSignInAsync(user, dto.Password, true);
        if (!result.Succeeded)
        {
            return BadRequest();
        }

        await signInManager.SignInAsync(user, false);

        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.UserName == user.UserName);
        return Ok(resultDto);
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(LoginDto dto)
    {
        var existing = await userManager.FindByNameAsync(dto.UserName);
        if (existing != null)
        {
            return BadRequest("Username already taken.");
        }

        var newUser = new User { UserName = dto.UserName };
        var result = await userManager.CreateAsync(newUser, dto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        await userManager.AddToRoleAsync(newUser, RoleNames.User);
        await signInManager.SignInAsync(newUser, false);

        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.UserName == newUser.UserName);
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
        var user = await userManager.FindByNameAsync(username!);
        if (user == null) return Unauthorized();

        user.DisplayName = dto.DisplayName;
        user.ProfilePictureUrl = dto.ProfilePictureUrl;
        user.Birthday = dto.Birthday;

        await userManager.UpdateAsync(user);

        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.UserName == user.UserName);
        return Ok(resultDto);
    }

    [HttpPost("birthday-reward")]
    [Authorize]
    public async Task<ActionResult<object>> ClaimBirthdayReward()
    {
        var username = User.GetCurrentUserName();
        var user = await userManager.Users.SingleOrDefaultAsync(x => x.UserName == username);
        if (user == null) return Unauthorized();

        if (user.Birthday == null) return BadRequest("No birthday set.");

        var today = DateTime.UtcNow;
        var isBirthday = user.Birthday.Value.Month == today.Month && user.Birthday.Value.Day == today.Day;
        if (!isBirthday) return BadRequest("Today is not your birthday.");

        if (user.BirthdayRewardClaimedForYear == today.Year)
            return BadRequest("Birthday reward already claimed this year.");

        // Award 100 bonus points
        var userPoints = await dataContext.Set<UserPoints>().FirstOrDefaultAsync(x => x.UserId == user.Id);
        if (userPoints == null)
        {
            userPoints = new UserPoints { UserId = user.Id, Balance = 0 };
            dataContext.Set<UserPoints>().Add(userPoints);
        }
        userPoints.Balance += 100;

        dataContext.Set<PointTransaction>().Add(new PointTransaction
        {
            UserId = user.Id,
            Amount = 100,
            Reason = "Happy Birthday! Bonus points gift.",
            CreatedAt = DateTime.UtcNow
        });

        user.BirthdayRewardClaimedForYear = today.Year;
        await userManager.UpdateAsync(user);
        await dataContext.SaveChangesAsync();

        return Ok(new { message = "Happy Birthday! 100 bonus points added!", pointsAwarded = 100 });
    }

    private static IQueryable<UserDto> GetUserDto(IQueryable<User> users)
    {
        var today = DateTime.UtcNow;
        return users.Select(x => new UserDto
        {
            Id = x.Id,
            UserName = x.UserName!,
            Roles = x.UserRoles.Select(y => y.Role!.Name).ToArray()!,
            DisplayName = x.DisplayName,
            ProfilePictureUrl = x.ProfilePictureUrl,
            Birthday = x.Birthday,
            IsBirthday = x.Birthday != null && x.Birthday.Value.Month == today.Month && x.Birthday.Value.Day == today.Day
        });
    }
}

public class UpdateProfileDto
{
    public string? DisplayName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public DateTime? Birthday { get; set; }
}
