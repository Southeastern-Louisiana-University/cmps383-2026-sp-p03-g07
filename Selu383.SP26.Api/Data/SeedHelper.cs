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

        await roleManager.CreateAsync(new Role { Name = RoleNames.Admin });
        await roleManager.CreateAsync(new Role { Name = RoleNames.User });
    }

    private static async Task AddUsers(IServiceProvider serviceProvider)
    {
        const string defaultPassword = "Password123!";
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        if (userManager.Users.Any())
        {
            return;
        }

        var adminUser = new User { UserName = "galkadi" };
        await userManager.CreateAsync(adminUser, defaultPassword);
        await userManager.AddToRoleAsync(adminUser, RoleNames.Admin);

        var bob = new User { UserName = "bob" };
        await userManager.CreateAsync(bob, defaultPassword);
        await userManager.AddToRoleAsync(bob, RoleNames.User);

        var sue = new User { UserName = "sue" };
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
                Address = "123 W Thomas St",
                City = "Hammond",
                State = "LA",
                Zip = "70401",
                Phone = "(985) 555-0101",
                HoursOfOperation = "Mon-Fri 6am-8pm, Sat-Sun 7am-7pm",
                Latitude = 30.5044,
                Longitude = -90.4612,
                TableCount = 10
            },
            new Location
            {
                Name = "Caffeinated Lions - Covington",
                Address = "456 N Columbia St",
                City = "Covington",
                State = "LA",
                Zip = "70433",
                Phone = "(985) 555-0202",
                HoursOfOperation = "Mon-Fri 6am-9pm, Sat-Sun 7am-8pm",
                Latitude = 30.4754,
                Longitude = -90.1007,
                TableCount = 20
            },
            new Location
            {
                Name = "Caffeinated Lions - Baton Rouge",
                Address = "789 Government St",
                City = "Baton Rouge",
                State = "LA",
                Zip = "70802",
                Phone = "(225) 555-0303",
                HoursOfOperation = "Mon-Sun 5:30am-9pm",
                Latitude = 30.4515,
                Longitude = -91.1871,
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
            // Drinks
            new MenuItem { Name = "Latte", Description = "Smooth espresso with steamed milk and a light layer of foam.", Category = "Drinks", Price = 4.50m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Cold Brew", Description = "Slow-steeped for 12 hours for a rich, smooth coffee over ice.", Category = "Drinks", Price = 4.00m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Mocha", Description = "Espresso, chocolate sauce, steamed milk, and whipped cream.", Category = "Drinks", Price = 4.75m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Cappuccino", Description = "Equal parts espresso, steamed milk, and velvety foam.", Category = "Drinks", Price = 4.25m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Iced Coffee", Description = "Freshly brewed coffee chilled and served over ice.", Category = "Drinks", Price = 3.75m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Americano", Description = "Espresso shots diluted with hot water for a bold, clean taste.", Category = "Drinks", Price = 3.50m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Vanilla Bean Frappuccino", Description = "Blended vanilla cream with a smooth, sweet finish.", Category = "Drinks", Price = 5.25m, IsAvailable = true, LocationId = 1 },
            // Food
            new MenuItem { Name = "Blueberry Muffin", Description = "Bursting with fresh blueberries and topped with a crumbly streusel.", Category = "Food", Price = 3.25m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Croissant", Description = "Buttery, flaky French croissant baked fresh every morning.", Category = "Food", Price = 3.50m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Avocado Toast", Description = "Multigrain toast topped with smashed avocado and sea salt.", Category = "Food", Price = 6.50m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Breakfast Sandwich", Description = "Egg, cheddar, and sausage on a toasted brioche bun.", Category = "Food", Price = 7.00m, IsAvailable = true, LocationId = 1 },
            // Pastries
            new MenuItem { Name = "Cinnamon Roll", Description = "Soft, gooey cinnamon roll drizzled with cream cheese icing.", Category = "Pastries", Price = 4.00m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Almond Danish", Description = "Flaky pastry filled with sweet almond cream and topped with sliced almonds.", Category = "Pastries", Price = 3.75m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Chocolate Croissant", Description = "Classic butter croissant filled with rich dark chocolate.", Category = "Pastries", Price = 4.00m, IsAvailable = true, LocationId = 1 },
            new MenuItem { Name = "Lemon Scone", Description = "Light, crumbly scone with lemon zest and a sweet glaze.", Category = "Pastries", Price = 3.25m, IsAvailable = true, LocationId = 1 }
        );

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddRewards(DataContext dataContext)
    {
        if (await dataContext.Rewards.AnyAsync())
        {
            // Update existing rewards that are missing RewardType
            var rewards = await dataContext.Set<Reward>().ToListAsync();
            var changed = false;
            foreach (var r in rewards)
            {
                if (string.IsNullOrEmpty(r.RewardType))
                {
                    if (r.Name == "10% Off Order") { r.RewardType = "discount"; r.DiscountValue = 10; changed = true; }
                    else if (r.Name == "Free Upgrade") { r.RewardType = "discount"; r.DiscountValue = 5; changed = true; }
                    else if (r.Name == "Free Coffee") { r.RewardType = "free_item"; r.FreeMenuItemId = 1; changed = true; }
                    else if (r.Name == "Free Pastry") { r.RewardType = "free_item"; r.FreeMenuItemId = 8; changed = true; }
                    else { r.RewardType = "discount"; r.DiscountValue = 10; changed = true; }
                }
            }
            if (changed) await dataContext.SaveChangesAsync();
            return;
        }

        dataContext.Set<Reward>().AddRange(
            new Reward { Name = "Free Coffee", Description = "Redeem for any size drip coffee or cold brew.", PointCost = 100, IsActive = true, RewardType = "free_item", FreeMenuItemId = 1 },
            new Reward { Name = "Free Pastry", Description = "Redeem for any pastry in our bakery case.", PointCost = 75, IsActive = true, RewardType = "free_item", FreeMenuItemId = 8 },
            new Reward { Name = "10% Off Order", Description = "Get 10% off your entire order.", PointCost = 50, IsActive = true, RewardType = "discount", DiscountValue = 10 },
            new Reward { Name = "Free Upgrade", Description = "Upgrade any drink to the next size for free.", PointCost = 25, IsActive = true, RewardType = "discount", DiscountValue = 5 }
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
