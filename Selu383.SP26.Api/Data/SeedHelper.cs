using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Locations;
using Selu383.SP26.Api.Features.Menu;
using Selu383.SP26.Api.Features.Rewards;

namespace Selu383.SP26.Api.Data;

public static class SeedHelper
{
    public static async Task MigrateAndSeed(IServiceProvider serviceProvider)
    {
        var dataContext = serviceProvider.GetRequiredService<DataContext>();

        await MigrateDatabase(dataContext);

        await AddRoles(serviceProvider);
        await AddUsers(serviceProvider);
        await AddLocations(dataContext);
        await AddMenuItems(dataContext);
        await AddRewards(dataContext);
    }

    private static async Task AddRoles(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<Role>>();

        if (roleManager.Roles.Any())
        {
            return;
        }

        await roleManager.CreateAsync(new Role
        {
            Name = RoleNames.Admin
        });

        await roleManager.CreateAsync(new Role
        {
            Name = RoleNames.User
        });
    }

    private static async Task AddUsers(IServiceProvider serviceProvider)
    {
        const string defaultPassword = "Password123!";
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        if (userManager.Users.Any())
        {
            return;
        }

        var adminUser = new User
        {
            UserName = "galkadi"
        };
        await userManager.CreateAsync(adminUser, defaultPassword);
        await userManager.AddToRoleAsync(adminUser, RoleNames.Admin);

        var bob = new User
        {
            UserName = "bob"
        };
        await userManager.CreateAsync(bob, defaultPassword);
        await userManager.AddToRoleAsync(bob, RoleNames.User);

        var sue = new User
        {
            UserName = "sue"
        };
        await userManager.CreateAsync(sue, defaultPassword);
        await userManager.AddToRoleAsync(sue, RoleNames.User);
    }

    private static async Task AddLocations(DataContext dataContext)
    {
        if (await dataContext.Locations.AnyAsync())
        {
            return;
        }

        dataContext.Set<Location>().AddRange(
            new Location
            {
                Name = "Caffeinated Lions - Hammond",
                Address = "123 Main St, Hammond, LA",
                TableCount = 10
            },
            new Location
            {
                Name = "Caffeinated Lions - Covington",
                Address = "456 Oak Ave, Covington, LA",
                TableCount = 20
            },
            new Location
            {
                Name = "Caffeinated Lions - Baton Rouge",
                Address = "789 Pine Ln, Baton Rouge, LA",
                TableCount = 15
            }
        );

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddMenuItems(DataContext dataContext)
    {
        if (await dataContext.MenuItems.AnyAsync())
        {
            return;
        }

        dataContext.Set<MenuItem>().AddRange(
            new MenuItem
            {
                Name = "Latte",
                Category = "Drinks",
                Price = 4.50m,
                IsAvailable = true,
                LocationId = 1
            },
            new MenuItem
            {
                Name = "Cold Brew",
                Category = "Drinks",
                Price = 4.00m,
                IsAvailable = true,
                LocationId = 1
            },
            new MenuItem
            {
                Name = "Blueberry Muffin",
                Category = "Food",
                Price = 3.25m,
                IsAvailable = true,
                LocationId = 1
            },
            new MenuItem
            {
                Name = "Mocha",
                Category = "Drinks",
                Price = 4.75m,
                IsAvailable = true,
                LocationId = 2
            },
            new MenuItem
            {
                Name = "Croissant",
                Category = "Food",
                Price = 3.50m,
                IsAvailable = true,
                LocationId = 2
            },
            new MenuItem
            {
                Name = "Iced Coffee",
                Category = "Drinks",
                Price = 3.75m,
                IsAvailable = true,
                LocationId = 3
            }
        );

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddRewards(DataContext dataContext)
    {
        if (await dataContext.Rewards.AnyAsync())
        {
            return;
        }

        dataContext.Set<Reward>().AddRange(
            new Reward
            {
                Name = "Free Coffee",
                Description = "Get any size coffee for free",
                PointsCost = 100,
                IsActive = true
            },
            new Reward
            {
                Name = "Free Pastry",
                Description = "Get any pastry item for free",
                PointsCost = 75,
                IsActive = true
            },
            new Reward
            {
                Name = "$5 Off Purchase",
                Description = "$5 discount on your next order",
                PointsCost = 150,
                IsActive = true
            },
            new Reward
            {
                Name = "Free Drink Upgrade",
                Description = "Upgrade any drink to large size",
                PointsCost = 50,
                IsActive = true
            }
        );

        await dataContext.SaveChangesAsync();
    }

    private static async Task MigrateDatabase(DataContext dataContext)
    {
        const int maxAttempts = 10;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                await dataContext.Database.MigrateAsync();
                return;
            }
            catch (SqlException) when (attempt < maxAttempts)
            {
                await Task.Delay(TimeSpan.FromSeconds(3));
            }
        }

        await dataContext.Database.MigrateAsync();
    }
}
