using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Locations;
using Selu383.SP26.Api.Features.Menu;
using Selu383.SP26.Api.Features.Orders;
using Selu383.SP26.Api.Features.Payments;
using Selu383.SP26.Api.Features.Notifications;
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
        await AddRewardTiers(dataContext);
        await AddSampleOrders(dataContext);
        await AddNotifications(dataContext);
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
            Name = RoleNames.Manager
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

        // Only seed galkadi, bob, sue

        // Optionally ensure other seed users exist
        var adminUser = await userManager.FindByNameAsync("galkadi");
        if (adminUser == null)
        {
            adminUser = new User { UserName = "galkadi" };
            await userManager.CreateAsync(adminUser, defaultPassword);
        }
        if (string.IsNullOrWhiteSpace(adminUser.Email) || string.IsNullOrWhiteSpace(adminUser.PhoneNumber))
        {
            adminUser.Email = string.IsNullOrWhiteSpace(adminUser.Email) ? "galkadi@example.com" : adminUser.Email;
            adminUser.PhoneNumber = string.IsNullOrWhiteSpace(adminUser.PhoneNumber) ? "9855550101" : adminUser.PhoneNumber;
            await userManager.UpdateAsync(adminUser);
        }
        if (!await userManager.IsInRoleAsync(adminUser, RoleNames.Admin))
        {
            await userManager.AddToRoleAsync(adminUser, RoleNames.Admin);
        }

        var bob = await userManager.FindByNameAsync("bob");
        if (bob == null)
        {
            bob = new User { UserName = "bob" };
            await userManager.CreateAsync(bob, defaultPassword);
        }
        if (string.IsNullOrWhiteSpace(bob.Email) || string.IsNullOrWhiteSpace(bob.PhoneNumber))
        {
            bob.Email = string.IsNullOrWhiteSpace(bob.Email) ? "bob@example.com" : bob.Email;
            bob.PhoneNumber = string.IsNullOrWhiteSpace(bob.PhoneNumber) ? "9855550102" : bob.PhoneNumber;
            await userManager.UpdateAsync(bob);
        }
        if (await userManager.IsInRoleAsync(bob, RoleNames.User))
        {
            await userManager.RemoveFromRoleAsync(bob, RoleNames.User);
        }
        if (!await userManager.IsInRoleAsync(bob, RoleNames.Manager))
        {
            await userManager.AddToRoleAsync(bob, RoleNames.Manager);
        }

        var sue = await userManager.FindByNameAsync("sue");
        if (sue == null)
        {
            sue = new User { UserName = "sue", Points = 1000 };
            await userManager.CreateAsync(sue, defaultPassword);
        }
        else if (sue.Points < 1000)
        {
            sue.Points = 1000;
            await userManager.UpdateAsync(sue);
        }
        if (string.IsNullOrWhiteSpace(sue.Email) || string.IsNullOrWhiteSpace(sue.PhoneNumber))
        {
            sue.Email = string.IsNullOrWhiteSpace(sue.Email) ? "sue@example.com" : sue.Email;
            sue.PhoneNumber = string.IsNullOrWhiteSpace(sue.PhoneNumber) ? "9855550103" : sue.PhoneNumber;
            await userManager.UpdateAsync(sue);
        }
        if (await userManager.IsInRoleAsync(sue, RoleNames.User))
        {
            await userManager.RemoveFromRoleAsync(sue, RoleNames.User);
        }
        if (!await userManager.IsInRoleAsync(sue, RoleNames.Manager))
        {
            await userManager.AddToRoleAsync(sue, RoleNames.Manager);
        }
    }

    private static async Task AddLocations(DataContext dataContext)
    {
        var sueManagerId = await dataContext.Users
            .Where(x => x.UserName == "sue")
            .Select(x => (int?)x.Id)
            .FirstOrDefaultAsync();

        var seededLocations = new[]
        {
            new Location
            {
                Name = "Hammond",
                Address = "110 N Cate St, Hammond, LA",
                TableCount = 10,
                ManagerId = sueManagerId
            },
            new Location
            {
                Name = "New York",
                Address = "72 E 1st St, New York, NY",
                TableCount = 20
            },
            new Location
            {
                Name = "New Orleans",
                Address = "1140 S Carrollton Ave, New Orleans, LA",
                TableCount = 15
            }
        };

        var allLocations = await dataContext.Locations
            .OrderBy(x => x.Id)
            .ToListAsync();

        if (allLocations.Count == 0)
        {
            dataContext.Set<Location>().AddRange(seededLocations);
            await dataContext.SaveChangesAsync();
            return;
        }

        // Update the first 3 rows to the canonical seeded data
        var keepLocations = allLocations.Take(seededLocations.Length).ToList();
        for (var index = 0; index < keepLocations.Count && index < seededLocations.Length; index++)
        {
            var existingLocation = keepLocations[index];
            var seededLocation = seededLocations[index];

            existingLocation.Name = seededLocation.Name;
            existingLocation.Address = seededLocation.Address;
            existingLocation.TableCount = seededLocation.TableCount;
            existingLocation.ManagerId = seededLocation.ManagerId;
        }

        if (keepLocations.Count < seededLocations.Length)
        {
            dataContext.Set<Location>().AddRange(seededLocations.Skip(keepLocations.Count));
        }

        await dataContext.SaveChangesAsync();

        // Remove duplicate locations beyond the 3 canonical ones (from old seed runs)
        var keepIds = keepLocations.Select(x => x.Id).ToHashSet();
        var extraLocations = allLocations.Where(x => !keepIds.Contains(x.Id)).ToList();
        if (extraLocations.Count > 0)
        {
            try
            {
                dataContext.Set<Location>().RemoveRange(extraLocations);
                await dataContext.SaveChangesAsync();
            }
            catch (Exception)
            {
                // FK constraints from existing orders/reservations - skip cleanup
                dataContext.ChangeTracker.Clear();
            }
        }
    }

    private static async Task AddMenuItems(DataContext dataContext)
    {
        static MenuItem CreateMenuItem(
            string name,
            string category,
            string description,
            decimal price,
            int locationId,
            string imageUrl,
            int calories,
            string preparationTag,
            bool isFeatured = false,
            int inventoryCount = 8)
        {
            return new MenuItem
            {
                Name = name,
                Category = category,
                Description = description,
                Price = price,
                IsAvailable = true,
                LocationId = locationId,
                ImageUrl = imageUrl,
                Calories = calories,
                IsFeatured = isFeatured,
                InventoryCount = inventoryCount,
                PreparationTag = preparationTag
            };
        }

        var seededMenuItems = new[] { 1, 2, 3 }
            .Select(locationId =>
                CreateMenuItem(
                    "Caffeinated Lions Mug",
                    "Gifts",
                    "Branded ceramic mug with the house olive-and-gold palette.",
                    16.00m,
                    locationId,
                    "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=400&q=80",
                    0,
                    "Merch"))
            .ToArray();

        var drinkLocationIds = new[] { 1, 2, 3 };
        var crepeLocationIds = new[] { 1, 2, 3 };
        var bagelLocationIds = new[] { 1, 2, 3 };

        var drinkMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Iced Latte",
            "Supernova",
            "Roaring Frappe",
            "Black & White Cold Brew",
            "Strawberry Limeade",
            "Shaken Lemonade",
        };
        var sweetCrepeMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Mannino Honey Crepe",
            "Downtowner",
            "Funky Monkey",
            "Le S'mores",
            "Strawberry Fields",
            "Bonjour",
            "Banana Foster",
        };
        var savoryCrepeMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Matt's Scrambled Eggs",
            "Meanie Mushroom",
            "Turkey Club",
            "Green Machine",
            "Perfect Pair",
            "Crepe Fromage",
            "Farmers Market Crepe",
        };
        var bagelMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Travis Special",
            "Crème Brulagel",
            "The Fancy One",
            "Breakfast Bagel",
            "The Classic",
        };
        var retiredMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Toffee Nut Latte",
            "Charcoal Latte",
            "Matcha Latte",
        };

        seededMenuItems = seededMenuItems
            .Concat(
                crepeLocationIds.SelectMany(locationId => new[]
                {
                    // Sweet Crepes
                    CreateMenuItem(
                        "Mannino Honey Crepe",
                        "Sweet Crepes",
		                        "A sweet crepe drizzled with Mannino honey and topped with mixed berries.",
		                        10.00m,
		                        locationId,
		                        "/menu/crepes/mannino-honey-crepe.png",
		                        520,
		                        "Sweet Crepe",
		                        isFeatured: locationId == 1),
                    CreateMenuItem(
                        "Downtowner",
                        "Sweet Crepes",
		                        "Strawberries and bananas wrapped in a crepe, finished with Nutella and Hershey's chocolate sauce.",
		                        10.75m,
		                        locationId,
		                        "/menu/crepes/downtowner.png",
		                        610,
		                        "Sweet Crepe"),
                    CreateMenuItem(
                        "Funky Monkey",
                        "Sweet Crepes",
		                        "Nutella and bananas wrapped in a crepe, served with whipped cream.",
		                        10.00m,
		                        locationId,
		                        "/menu/crepes/funky-monkey.png",
		                        590,
		                        "Sweet Crepe"),
                    CreateMenuItem(
                        "Le S'mores",
                        "Sweet Crepes",
		                        "Marshmallow cream and chocolate sauce inside a crepe, topped with graham cracker crumbs.",
		                        9.50m,
		                        locationId,
		                        "/menu/crepes/le-smores.png",
		                        640,
		                        "Sweet Crepe"),
                    CreateMenuItem(
                        "Strawberry Fields",
                        "Sweet Crepes",
		                        "Fresh strawberries with Hershey's chocolate drizzle and a dusting of powdered sugar.",
		                        10.00m,
		                        locationId,
		                        "/menu/crepes/strawberry-fields.png",
		                        500,
		                        "Sweet Crepe"),
                    CreateMenuItem(
                        "Bonjour",
                        "Sweet Crepes",
		                        "A sweet crepe filled with syrup and cinnamon, finished with powdered sugar.",
		                        8.50m,
		                        locationId,
		                        "/menu/crepes/bonjour.png",
		                        420,
		                        "Sweet Crepe"),
                    CreateMenuItem(
                        "Banana Foster",
                        "Sweet Crepes",
		                        "Bananas with cinnamon in a crepe, topped with a generous drizzle of caramel sauce.",
		                        8.95m,
		                        locationId,
		                        "/menu/crepes/banana-foster.png",
		                        530,
		                        "Sweet Crepe"),

                    // Savory Crepes
                    CreateMenuItem(
                        "Matt's Scrambled Eggs",
                        "Savory Crepes",
                        "Scrambled eggs and melted mozzarella cheese wrapped in a crepe.",
                        5.00m,
                        locationId,
                        "/menu/crepes/matts-scrambled-eggs.png",
                        410,
                        "Savory Crepe"),
                    CreateMenuItem(
                        "Meanie Mushroom",
                        "Savory Crepes",
                        "Sautéed mushrooms, mozzarella, tomato, and bacon inside a delicate crepe.",
                        10.50m,
                        locationId,
                        "/menu/crepes/meanie-mushroom.png",
                        520,
                        "Savory Crepe"),
                    CreateMenuItem(
                        "Turkey Club",
                        "Savory Crepes",
                        "Sliced turkey, bacon, spinach, and tomato wrapped in a savory crepe.",
                        10.50m,
                        locationId,
                        "/menu/crepes/turkey-club.png",
                        540,
                        "Savory Crepe"),
                    CreateMenuItem(
                        "Green Machine",
                        "Savory Crepes",
                        "Spinach, artichokes, and mozzarella cheese inside a fresh crepe.",
                        10.00m,
                        locationId,
                        "/menu/crepes/green-machine.png",
                        480,
                        "Savory Crepe"),
                    CreateMenuItem(
                        "Perfect Pair",
                        "Savory Crepes",
                        "A unique combination of bacon and Nutella wrapped in a crepe.",
                        10.00m,
                        locationId,
                        "/menu/crepes/perfect-pair.png",
                        620,
                        "Savory Crepe"),
                    CreateMenuItem(
                        "Crepe Fromage",
                        "Savory Crepes",
                        "A savory crepe filled with a blend of cheeses.",
                        8.00m,
                        locationId,
                        "/menu/crepes/crepe-fromage.png",
                        450,
                        "Savory Crepe"),
                    CreateMenuItem(
                        "Farmers Market Crepe",
                        "Savory Crepes",
                        "Turkey, spinach, and mozzarella wrapped in a savory crepe.",
                        10.50m,
                        locationId,
                        "/menu/crepes/farmers-market-crepe.png",
                        510,
                        "Savory Crepe"),
                }))
            .Concat(
                bagelLocationIds.SelectMany(locationId => new[]
                {
                    CreateMenuItem(
                        "Travis Special",
                        "Bagels",
                        "Cream cheese, salmon, spinach, and a fried egg served on a freshly toasted bagel.",
                        14.00m,
                        locationId,
                        "/menu/sandwiches-bagels/travis-special.png",
                        650,
                        "Bagel",
                        isFeatured: locationId == 1),
                    CreateMenuItem(
                        "Crème Brulagel",
                        "Bagels",
                        "A toasted bagel with a caramelized sugar crust inspired by crème brûlée, served with cream cheese.",
                        8.00m,
                        locationId,
                        "/menu/sandwiches-bagels/creme-brulagel.png",
                        520,
                        "Bagel"),
                    CreateMenuItem(
                        "The Fancy One",
                        "Bagels",
                        "Smoked salmon, cream cheese, and fresh dill on a toasted bagel.",
                        13.00m,
                        locationId,
                        "/menu/sandwiches-bagels/the-fancy-one.png",
                        610,
                        "Bagel"),
                    CreateMenuItem(
                        "Breakfast Bagel",
                        "Bagels",
                        "A toasted bagel with your choice of ham, bacon, or sausage, a fried egg, and cheddar cheese.",
                        9.50m,
                        locationId,
                        "/menu/sandwiches-bagels/breakfast-bagel.png",
                        720,
                        "Bagel"),
                    CreateMenuItem(
                        "The Classic",
                        "Bagels",
                        "A toasted bagel with cream cheese.",
                        5.25m,
                        locationId,
                        "/menu/sandwiches-bagels/the-classic.png",
                        420,
                        "Bagel"),
	                }))
	            .Concat(
	                drinkLocationIds.SelectMany(locationId => new[]
	                {
	                    CreateMenuItem(
	                        "Iced Latte",
	                        "Drinks",
	                        "Espresso and milk served over ice for a refreshing coffee drink.",
	                        5.50m,
	                        locationId,
	                        "/menu/drinks/iced-latte.png",
	                        180,
	                        "Cold Drinks"),
	                    CreateMenuItem(
	                        "Supernova",
	                        "Drinks",
	                        "A unique coffee blend with a complex, balanced profile and subtle sweetness. Delicious as espresso or paired with milk.",
	                        7.95m,
	                        locationId,
	                        "/menu/drinks/supernova.png",
	                        120,
	                        "Signature Blend"),
	                    CreateMenuItem(
	                        "Roaring Frappe",
	                        "Drinks",
	                        "Cold brew, milk, and ice blended together with a signature syrup or flavor, topped with whipped cream.",
	                        6.20m,
	                        locationId,
	                        "/menu/drinks/roaring-frappe.png",
	                        380,
	                        "Blended"),
	                    CreateMenuItem(
	                        "Black & White Cold Brew",
	                        "Drinks",
	                        "Cold brew made with both dark and light roast beans, finished with a drizzle of condensed milk.",
	                        5.15m,
	                        locationId,
	                        "/menu/drinks/black-and-white-cold-brew.png",
	                        70,
	                        "Cold Brew"),
	                    CreateMenuItem(
	                        "Strawberry Limeade",
	                        "Drinks",
	                        "Fresh lime juice blended with strawberry purée for a refreshing, tangy drink.",
	                        5.00m,
	                        locationId,
	                        "/menu/drinks/strawberry-limeade.png",
	                        170,
	                        "Limeade",
	                        isFeatured: locationId == 1
	                    ),
	                    CreateMenuItem(
	                        "Shaken Lemonade",
	                        "Drinks",
	                        "Fresh lemon juice and simple syrup vigorously shaken for a bright, refreshing lemonade.",
	                        5.00m,
	                        locationId,
	                        "/menu/drinks/shaken-lemonade.png",
	                        150,
	                        "Lemonade"
	                    ),
	                }))
	            .ToArray();

        var existingMenuItems = await dataContext.MenuItems.ToListAsync();
	        var removedMenuItems = existingMenuItems
	            .Where(existingItem =>
	                !MenuCatalog.IsSupportedCategory(existingItem.Category)
	                || (string.Equals(existingItem.Category, "Drinks", StringComparison.OrdinalIgnoreCase)
	                    && !drinkMenuNames.Contains(existingItem.Name))
	                || (string.Equals(existingItem.Category, "Sweet Crepes", StringComparison.OrdinalIgnoreCase)
	                    && !sweetCrepeMenuNames.Contains(existingItem.Name))
	                || (string.Equals(existingItem.Category, "Savory Crepes", StringComparison.OrdinalIgnoreCase)
	                    && !savoryCrepeMenuNames.Contains(existingItem.Name))
	                || (string.Equals(existingItem.Category, "Bagels", StringComparison.OrdinalIgnoreCase)
	                    && !bagelMenuNames.Contains(existingItem.Name))
	                || retiredMenuNames.Contains(existingItem.Name))
	            .ToList();

        if (removedMenuItems.Count > 0)
        {
            dataContext.MenuItems.RemoveRange(removedMenuItems);
            existingMenuItems = existingMenuItems.Except(removedMenuItems).ToList();
        }

        foreach (var seededMenuItem in seededMenuItems)
        {
            var existingMenuItem = existingMenuItems.FirstOrDefault(x =>
                string.Equals(x.Name, seededMenuItem.Name, StringComparison.OrdinalIgnoreCase)
                && x.LocationId == seededMenuItem.LocationId);

            if (existingMenuItem == null)
            {
                dataContext.Set<MenuItem>().Add(seededMenuItem);
                continue;
            }

            existingMenuItem.Name = seededMenuItem.Name;
            existingMenuItem.Category = seededMenuItem.Category;
            existingMenuItem.Description = seededMenuItem.Description;
            existingMenuItem.Price = seededMenuItem.Price;
            existingMenuItem.IsAvailable = seededMenuItem.IsAvailable;
            existingMenuItem.LocationId = seededMenuItem.LocationId;
            existingMenuItem.ImageUrl = seededMenuItem.ImageUrl;
            existingMenuItem.Calories = seededMenuItem.Calories;
            existingMenuItem.IsFeatured = seededMenuItem.IsFeatured;
            existingMenuItem.InventoryCount = seededMenuItem.InventoryCount;
            existingMenuItem.PreparationTag = seededMenuItem.PreparationTag;
        }

	        await dataContext.SaveChangesAsync();

	        var icedLatteIds = await dataContext.MenuItems
	            .Where(x => x.Name == "Iced Latte" && drinkLocationIds.Contains(x.LocationId))
	            .GroupBy(x => x.LocationId)
	            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
	            .ToDictionaryAsync(x => x.LocationId, x => x.Id);
	        var supernovaIds = await dataContext.MenuItems
	            .Where(x => x.Name == "Supernova" && drinkLocationIds.Contains(x.LocationId))
	            .GroupBy(x => x.LocationId)
	            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
	            .ToDictionaryAsync(x => x.LocationId, x => x.Id);
	        var roaringFrappeIds = await dataContext.MenuItems
	            .Where(x => x.Name == "Roaring Frappe" && drinkLocationIds.Contains(x.LocationId))
	            .GroupBy(x => x.LocationId)
	            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
	            .ToDictionaryAsync(x => x.LocationId, x => x.Id);
	        var blackAndWhiteColdBrewIds = await dataContext.MenuItems
	            .Where(x => x.Name == "Black & White Cold Brew" && drinkLocationIds.Contains(x.LocationId))
	            .GroupBy(x => x.LocationId)
	            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
	            .ToDictionaryAsync(x => x.LocationId, x => x.Id);
	        var strawberryLimeadeIds = await dataContext.MenuItems
	            .Where(x => x.Name == "Strawberry Limeade" && drinkLocationIds.Contains(x.LocationId))
	            .GroupBy(x => x.LocationId)
	            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
	            .ToDictionaryAsync(x => x.LocationId, x => x.Id);
	        var shakenLemonadeIds = await dataContext.MenuItems
	            .Where(x => x.Name == "Shaken Lemonade" && drinkLocationIds.Contains(x.LocationId))
	            .GroupBy(x => x.LocationId)
	            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
	            .ToDictionaryAsync(x => x.LocationId, x => x.Id);

	        var seededCustomizations = new List<MenuCustomization>();

	        foreach (var locationId in drinkLocationIds)
	        {
	            if (icedLatteIds.TryGetValue(locationId, out var icedLatteId))
	            {
	                seededCustomizations.AddRange(
	                [
                    new MenuCustomization { MenuItemId = icedLatteId, GroupName = "Milk", OptionName = "Whole Milk", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
                    new MenuCustomization { MenuItemId = icedLatteId, GroupName = "Milk", OptionName = "Oatmilk", AdditionalPrice = 0.75m, SortOrder = 2 },
                    new MenuCustomization { MenuItemId = icedLatteId, GroupName = "Espresso", OptionName = "Extra Shot", AdditionalPrice = 1.25m, SortOrder = 3 },
                ]);
            }

	            if (supernovaIds.TryGetValue(locationId, out var supernovaId))
	            {
	                seededCustomizations.AddRange(
	                [
	                    new MenuCustomization { MenuItemId = supernovaId, GroupName = "Milk", OptionName = "Whole Milk", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
	                    new MenuCustomization { MenuItemId = supernovaId, GroupName = "Milk", OptionName = "Oatmilk", AdditionalPrice = 0.75m, SortOrder = 2 },
	                    new MenuCustomization { MenuItemId = supernovaId, GroupName = "Espresso", OptionName = "Extra Shot", AdditionalPrice = 1.25m, SortOrder = 3 },
	                ]);
	            }

            if (roaringFrappeIds.TryGetValue(locationId, out var roaringFrappeId))
            {
                seededCustomizations.AddRange(
                [
                    new MenuCustomization { MenuItemId = roaringFrappeId, GroupName = "Toppings", OptionName = "Whipped Cream", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
                    new MenuCustomization { MenuItemId = roaringFrappeId, GroupName = "Toppings", OptionName = "Chocolate Drizzle", AdditionalPrice = 0.50m, SortOrder = 2 },
                ]);
            }

	            if (blackAndWhiteColdBrewIds.TryGetValue(locationId, out var blackAndWhiteColdBrewId))
	            {
	                seededCustomizations.AddRange(
	                [
	                    new MenuCustomization { MenuItemId = blackAndWhiteColdBrewId, GroupName = "Sweetener", OptionName = "Condensed Milk Drizzle", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
	                    new MenuCustomization { MenuItemId = blackAndWhiteColdBrewId, GroupName = "Sweetener", OptionName = "Vanilla Sweet Cream", AdditionalPrice = 0.75m, SortOrder = 2 },
	                    new MenuCustomization { MenuItemId = blackAndWhiteColdBrewId, GroupName = "Sweetener", OptionName = "Sugar Free Vanilla", AdditionalPrice = 0.50m, SortOrder = 3 },
	                ]);
	            }

	            if (strawberryLimeadeIds.TryGetValue(locationId, out var strawberryLimeadeId))
	            {
	                seededCustomizations.AddRange(
	                [
	                    new MenuCustomization { MenuItemId = strawberryLimeadeId, GroupName = "Sweetener", OptionName = "Classic", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
	                    new MenuCustomization { MenuItemId = strawberryLimeadeId, GroupName = "Sweetener", OptionName = "Less sweet", AdditionalPrice = 0, SortOrder = 2 },
	                    new MenuCustomization { MenuItemId = strawberryLimeadeId, GroupName = "Sweetener", OptionName = "No sweetener", AdditionalPrice = 0, SortOrder = 3 },
	                ]);

	                seededCustomizations.AddRange(
	                [
	                    new MenuCustomization { MenuItemId = strawberryLimeadeId, GroupName = "Ice", OptionName = "Regular ice", AdditionalPrice = 0, IsDefault = true, SortOrder = 10 },
	                    new MenuCustomization { MenuItemId = strawberryLimeadeId, GroupName = "Ice", OptionName = "Light ice", AdditionalPrice = 0, SortOrder = 11 },
	                    new MenuCustomization { MenuItemId = strawberryLimeadeId, GroupName = "Ice", OptionName = "No ice", AdditionalPrice = 0, SortOrder = 12 },
	                ]);

	                seededCustomizations.AddRange(
	                [
	                    new MenuCustomization { MenuItemId = strawberryLimeadeId, GroupName = "Add-ons", OptionName = "Add fresh mint", AdditionalPrice = 0.50m, SortOrder = 20 },
	                    new MenuCustomization { MenuItemId = strawberryLimeadeId, GroupName = "Add-ons", OptionName = "Add extra strawberry purée", AdditionalPrice = 0.75m, SortOrder = 21 },
	                ]);
	            }

	            if (shakenLemonadeIds.TryGetValue(locationId, out var shakenLemonadeId))
	            {
	                seededCustomizations.AddRange(
	                [
	                    new MenuCustomization { MenuItemId = shakenLemonadeId, GroupName = "Sweetener", OptionName = "Classic", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
	                    new MenuCustomization { MenuItemId = shakenLemonadeId, GroupName = "Sweetener", OptionName = "Less sweet", AdditionalPrice = 0, SortOrder = 2 },
	                    new MenuCustomization { MenuItemId = shakenLemonadeId, GroupName = "Sweetener", OptionName = "No sweetener", AdditionalPrice = 0, SortOrder = 3 },
	                ]);

	                seededCustomizations.AddRange(
	                [
	                    new MenuCustomization { MenuItemId = shakenLemonadeId, GroupName = "Ice", OptionName = "Regular ice", AdditionalPrice = 0, IsDefault = true, SortOrder = 10 },
	                    new MenuCustomization { MenuItemId = shakenLemonadeId, GroupName = "Ice", OptionName = "Light ice", AdditionalPrice = 0, SortOrder = 11 },
	                    new MenuCustomization { MenuItemId = shakenLemonadeId, GroupName = "Ice", OptionName = "No ice", AdditionalPrice = 0, SortOrder = 12 },
	                ]);

	                seededCustomizations.AddRange(
	                [
	                    new MenuCustomization { MenuItemId = shakenLemonadeId, GroupName = "Add-ons", OptionName = "Add fresh mint", AdditionalPrice = 0.50m, SortOrder = 20 },
	                    new MenuCustomization { MenuItemId = shakenLemonadeId, GroupName = "Add-ons", OptionName = "Add strawberry purée", AdditionalPrice = 0.75m, SortOrder = 21 },
	                ]);
	            }
	        }

	        var savoryCrepeNames = new[]
	        {
	            "Matt's Scrambled Eggs",
	            "Meanie Mushroom",
	            "Turkey Club",
	            "Green Machine",
	            "Perfect Pair",
	            "Crepe Fromage",
	            "Farmers Market Crepe",
	        };

	        var savoryCrepeIds = await dataContext.MenuItems
	            .Where(x =>
	                x.Category == "Savory Crepes"
	                && x.PreparationTag == "Savory Crepe"
	                && crepeLocationIds.Contains(x.LocationId)
	                && savoryCrepeNames.Contains(x.Name))
	            .GroupBy(x => new { x.LocationId, x.Name })
	            .Select(group => new { group.Key.LocationId, group.Key.Name, Id = group.Min(x => x.Id) })
	            .ToListAsync();

	        foreach (var crepe in savoryCrepeIds)
	        {
	            seededCustomizations.AddRange(
	            [
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Add-ons", OptionName = "Extra cheese", AdditionalPrice = 0.75m, SortOrder = 1 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Add-ons", OptionName = "Add bacon", AdditionalPrice = 1.25m, SortOrder = 2 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Add-ons", OptionName = "Add turkey", AdditionalPrice = 1.50m, SortOrder = 3 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Add-ons", OptionName = "Add egg", AdditionalPrice = 1.00m, SortOrder = 4 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Add-ons", OptionName = "Add spinach", AdditionalPrice = 0.50m, SortOrder = 5 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Add-ons", OptionName = "Add mushrooms", AdditionalPrice = 0.75m, SortOrder = 6 },
	            ]);

	            seededCustomizations.AddRange(
	            [
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Sauces", OptionName = "Garlic aioli", AdditionalPrice = 0, SortOrder = 20 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Sauces", OptionName = "Honey mustard", AdditionalPrice = 0, SortOrder = 21 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Sauces", OptionName = "Hot sauce", AdditionalPrice = 0, SortOrder = 22 },
	            ]);

	            if (string.Equals(crepe.Name, "Perfect Pair", StringComparison.OrdinalIgnoreCase))
	            {
	                seededCustomizations.AddRange(
	                [
	                    new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Sweet finishes", OptionName = "Extra Nutella drizzle", AdditionalPrice = 0.75m, SortOrder = 30 },
	                    new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Sweet finishes", OptionName = "Powdered sugar", AdditionalPrice = 0.25m, SortOrder = 31 },
	                ]);
	            }
	        }

	        var sweetCrepeIds = await dataContext.MenuItems
	            .Where(x =>
	                x.Category == "Sweet Crepes"
	                && x.PreparationTag == "Sweet Crepe"
	                && crepeLocationIds.Contains(x.LocationId)
	                && sweetCrepeMenuNames.Contains(x.Name))
	            .GroupBy(x => new { x.LocationId, x.Name })
	            .Select(group => new { group.Key.LocationId, group.Key.Name, Id = group.Min(x => x.Id) })
	            .ToListAsync();

	        foreach (var crepe in sweetCrepeIds)
	        {
	            seededCustomizations.AddRange(
	            [
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Toppings", OptionName = "Whipped cream", AdditionalPrice = 0.50m, SortOrder = 1 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Toppings", OptionName = "Powdered sugar", AdditionalPrice = 0.25m, SortOrder = 2 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Toppings", OptionName = "Extra Nutella drizzle", AdditionalPrice = 0.75m, SortOrder = 3 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Toppings", OptionName = "Caramel drizzle", AdditionalPrice = 0.50m, SortOrder = 4 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Toppings", OptionName = "Chocolate drizzle", AdditionalPrice = 0.50m, SortOrder = 5 },
	            ]);

	            seededCustomizations.AddRange(
	            [
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Add-ons", OptionName = "Add strawberries", AdditionalPrice = 1.00m, SortOrder = 20 },
	                new MenuCustomization { MenuItemId = crepe.Id, GroupName = "Add-ons", OptionName = "Add banana slices", AdditionalPrice = 0.75m, SortOrder = 21 },
	            ]);
	        }

	        var bagelIds = await dataContext.MenuItems
	            .Where(x =>
	                x.Category == "Bagels"
	                && x.PreparationTag == "Bagel"
	                && bagelLocationIds.Contains(x.LocationId)
	                && bagelMenuNames.Contains(x.Name))
	            .GroupBy(x => new { x.LocationId, x.Name })
	            .Select(group => new { group.Key.LocationId, group.Key.Name, Id = group.Min(x => x.Id) })
	            .ToListAsync();

	        foreach (var bagel in bagelIds)
	        {
	            seededCustomizations.AddRange(
	            [
	                new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Add-ons", OptionName = "Extra cream cheese", AdditionalPrice = 0.75m, SortOrder = 1 },
	                new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Add-ons", OptionName = "Add egg", AdditionalPrice = 1.00m, SortOrder = 2 },
	                new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Add-ons", OptionName = "Add bacon", AdditionalPrice = 1.25m, SortOrder = 3 },
	                new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Add-ons", OptionName = "Add avocado", AdditionalPrice = 1.50m, SortOrder = 4 },
	                new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Add-ons", OptionName = "Add spinach", AdditionalPrice = 0.50m, SortOrder = 5 },
	                new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Add-ons", OptionName = "Add tomato", AdditionalPrice = 0.50m, SortOrder = 6 },
	            ]);

	            seededCustomizations.AddRange(
	            [
	                new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Sauces", OptionName = "Garlic aioli", AdditionalPrice = 0, SortOrder = 20 },
	                new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Sauces", OptionName = "Honey mustard", AdditionalPrice = 0, SortOrder = 21 },
	                new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Sauces", OptionName = "Hot sauce", AdditionalPrice = 0, SortOrder = 22 },
	            ]);

	            if (string.Equals(bagel.Name, "Travis Special", StringComparison.OrdinalIgnoreCase)
	                || string.Equals(bagel.Name, "The Fancy One", StringComparison.OrdinalIgnoreCase))
	            {
	                seededCustomizations.Add(new MenuCustomization { MenuItemId = bagel.Id, GroupName = "Add-ons", OptionName = "Extra salmon", AdditionalPrice = 2.50m, SortOrder = 7 });
	            }
	        }

	        var existingCustomizations = await dataContext.MenuCustomizations.ToListAsync();

	        foreach (var seededCustomization in seededCustomizations)
	        {
            var existingCustomization = existingCustomizations.FirstOrDefault(x =>
                x.MenuItemId == seededCustomization.MenuItemId
                && string.Equals(x.GroupName, seededCustomization.GroupName, StringComparison.OrdinalIgnoreCase)
                && string.Equals(x.OptionName, seededCustomization.OptionName, StringComparison.OrdinalIgnoreCase));

            if (existingCustomization == null)
            {
                dataContext.MenuCustomizations.Add(seededCustomization);
                existingCustomizations.Add(seededCustomization);
                continue;
            }

            existingCustomization.AdditionalPrice = seededCustomization.AdditionalPrice;
            existingCustomization.IsDefault = seededCustomization.IsDefault;
            existingCustomization.SortOrder = seededCustomization.SortOrder;
        }

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddRewards(DataContext dataContext)
    {
        // Simplified program:
        // - Earn 10 points per $1
        // - Redeem at 1000 points
	        var seededRewards = new[]
	        {
	            new Reward
	            {
	                Name = "Free Drink",
	                Description = "Redeem 1000 points for any drink (up to $7.95).",
	                PointsCost = 1000,
	                IsActive = true,
	                TierName = "Member",
	                OfferType = "Drink",
	                DiscountAmount = null,
	                BonusStars = 0
	            },
	            new Reward
	            {
	                Name = "Free Bagel",
	                Description = "Redeem 1500 points for any bagel item (up to $14.00).",
	                PointsCost = 1500,
	                IsActive = true,
	                TierName = "Member",
	                OfferType = "Food",
	                DiscountAmount = null,
	                BonusStars = 0
	            },
	            new Reward
	            {
	                Name = "Free Crepe",
	                Description = "Redeem 1750 points for any crepe (up to $10.75).",
	                PointsCost = 1750,
	                IsActive = true,
	                TierName = "Member",
	                OfferType = "Food",
	                DiscountAmount = null,
	                BonusStars = 0
            },
            new Reward
            {
                Name = "Caffeinated Lions Mug",
                Description = "Redeem 2000 points for a Caffeinated Lions Mug ($16.00 value).",
                PointsCost = 2000,
                IsActive = true,
                TierName = "Member",
                OfferType = "Merch",
                DiscountAmount = null,
                BonusStars = 0
            }
        };

        var existingRewards = await dataContext.Rewards.ToListAsync();
        var seededNames = new HashSet<string>(seededRewards.Select(x => x.Name), StringComparer.OrdinalIgnoreCase);

        foreach (var seededReward in seededRewards)
        {
            var existingReward = existingRewards.FirstOrDefault(x =>
                string.Equals(x.Name, seededReward.Name, StringComparison.OrdinalIgnoreCase));

            if (existingReward == null)
            {
                dataContext.Rewards.Add(seededReward);
                existingRewards.Add(seededReward);
                continue;
            }

            existingReward.Description = seededReward.Description;
            existingReward.PointsCost = seededReward.PointsCost;
            existingReward.IsActive = seededReward.IsActive;
            existingReward.TierName = seededReward.TierName;
            existingReward.OfferType = seededReward.OfferType;
            existingReward.DiscountAmount = seededReward.DiscountAmount;
            existingReward.BonusStars = seededReward.BonusStars;
        }

        foreach (var existingReward in existingRewards)
        {
            if (!seededNames.Contains(existingReward.Name))
            {
                existingReward.IsActive = false;
            }
        }

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddRewardTiers(DataContext dataContext)
    {
        var seededTiers = new[]
        {
            new RewardTier
            {
                Name = "Member",
                MinPoints = 0,
                Benefits = "Earn 10 points per $1 spent.",
                AccentColor = "#65711d"
            },
	            new RewardTier
	            {
	                Name = "Reward",
	                MinPoints = 1000,
	                Benefits = "Redeem a free drink once you hit 1000 points.",
	                AccentColor = "#d7a526"
	            }
	        };

        var existingTiers = await dataContext.RewardTiers.ToListAsync();

        foreach (var seededTier in seededTiers)
        {
            var existingTier = existingTiers.FirstOrDefault(x =>
                string.Equals(x.Name, seededTier.Name, StringComparison.OrdinalIgnoreCase));

            if (existingTier == null)
            {
                dataContext.RewardTiers.Add(seededTier);
                existingTiers.Add(seededTier);
                continue;
            }

            existingTier.MinPoints = seededTier.MinPoints;
            existingTier.Benefits = seededTier.Benefits;
            existingTier.AccentColor = seededTier.AccentColor;
        }

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddSampleOrders(DataContext dataContext)
    {
        if (await dataContext.Orders.AnyAsync())
        {
            return;
        }

        var sueId = await dataContext.Users
            .Where(x => x.UserName == "sue")
            .Select(x => x.Id)
            .FirstAsync();

        var locationId = await dataContext.Locations
            .Where(x => x.Name.Contains("Hammond"))
            .Select(x => x.Id)
            .FirstAsync();

	        var locationMenuItems = await dataContext.MenuItems
	            .Where(x => x.LocationId == locationId)
	            .ToListAsync();

	        var icedMocha = locationMenuItems.FirstOrDefault(x => x.Name == "Roaring Frappe")
	            ?? locationMenuItems.FirstOrDefault(x => x.Category == "Drinks")
	            ?? await dataContext.MenuItems.FirstAsync();
	        var secondDrink = locationMenuItems.FirstOrDefault(x => x.Name == "Supernova")
	            ?? locationMenuItems.FirstOrDefault(x => x.Category == "Drinks" && x.Id != icedMocha.Id)
	            ?? icedMocha;
	        var classicBagel = locationMenuItems.FirstOrDefault(x => x.Name == "The Classic")
	            ?? locationMenuItems.FirstOrDefault(x => x.Category == "Bagels")
	            ?? icedMocha;

        var orders = new[]
        {
            new Order
            {
                UserId = sueId,
                LocationId = locationId,
                OrderType = "pickup",
                Status = "Completed",
                Total = icedMocha.Price + (classicBagel.Price * 2),
                PaymentStatus = "Paid",
                PickupName = "Sue",
                CreatedAt = DateTime.UtcNow.AddHours(-6),
                StarsEarned = 18,
                Items =
                [
                    new OrderItem
                    {
                        MenuItemId = icedMocha.Id,
                        ItemName = icedMocha.Name,
                        Quantity = 1,
                        UnitPrice = icedMocha.Price,
                        Total = icedMocha.Price,
                        Customizations = "Whipped Cream"
                    },
                    new OrderItem
                    {
                        MenuItemId = classicBagel.Id,
                        ItemName = classicBagel.Name,
                        Quantity = 2,
                        UnitPrice = classicBagel.Price,
                        Total = classicBagel.Price * 2,
                        Customizations = "Toasted"
                    }
                ]
            },
	            new Order
	            {
	                UserId = sueId,
	                LocationId = locationId,
	                OrderType = "drive-thru",
	                Status = "Ready for pickup",
	                Total = secondDrink.Price,
	                PaymentStatus = "Paid",
	                PickupName = "Sue",
	                CreatedAt = DateTime.UtcNow.AddMinutes(-45),
	                StarsEarned = 7,
	                Items =
	                [
	                    new OrderItem
	                    {
	                        MenuItemId = secondDrink.Id,
	                        ItemName = secondDrink.Name,
	                        Quantity = 1,
	                        UnitPrice = secondDrink.Price,
	                        Total = secondDrink.Price,
	                        Customizations = "Oatmilk"
	                    }
	                ]
	            }
	        };

        dataContext.Orders.AddRange(orders);
        await dataContext.SaveChangesAsync();

        dataContext.Payments.AddRange(
            new Payment
            {
                UserId = sueId,
                OrderId = orders[0].Id,
                Amount = orders[0].Total,
                Method = "Card",
                Status = "Approved",
                ProviderReference = "seed-payment-1",
                CardLastFour = "4242",
                CreatedAt = orders[0].CreatedAt
            },
            new Payment
            {
                UserId = sueId,
                OrderId = orders[1].Id,
                Amount = orders[1].Total,
                Method = "Card",
                Status = "Approved",
                ProviderReference = "seed-payment-2",
                CardLastFour = "1881",
                CreatedAt = orders[1].CreatedAt
            }
        );

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddNotifications(DataContext dataContext)
    {
        if (await dataContext.Notifications.AnyAsync())
        {
            return;
        }

        var sueId = await dataContext.Users
            .Where(x => x.UserName == "sue")
            .Select(x => x.Id)
            .FirstAsync();

        dataContext.Notifications.AddRange(
	            new Notification
	            {
	                UserId = null,
	                Channel = "InApp",
	                Title = "Spring menu drop",
	                Message = "Try the Black & White Cold Brew and earn bonus Lions this week."
	            },
            new Notification
            {
                UserId = sueId,
                Channel = "Push",
                Title = "Order ready",
                Message = "Drive-thru order #2 is ready at the pickup window."
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
