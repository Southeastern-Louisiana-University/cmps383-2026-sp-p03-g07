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
        if (!await userManager.IsInRoleAsync(bob, RoleNames.User))
        {
            await userManager.AddToRoleAsync(bob, RoleNames.User);
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
        if (!await userManager.IsInRoleAsync(sue, RoleNames.User))
        {
            await userManager.AddToRoleAsync(sue, RoleNames.User);
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

        var seededMenuItems = new[]
        {
            new MenuItem
            {
                Name = "Vegan Hummus Wrap",
                Category = "Vegan",
                Description = "Hummus, cucumbers, greens, pickled onions, and herbs wrapped fresh to order.",
                Price = 7.75m,
                IsAvailable = true,
                LocationId = 3,
                ImageUrl = "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=400&q=80",
                Calories = 340,
                IsFeatured = true,
                InventoryCount = 5,
                PreparationTag = "Plant-Based"
            },
            new MenuItem
            {
                Name = "Caffeinated Lions Mug",
                Category = "Gifts",
                Description = "Branded ceramic mug with the house olive-and-gold palette.",
                Price = 16.00m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=400&q=80",
                Calories = 0,
                InventoryCount = 8,
                PreparationTag = "Merch"
            }
        };

        var coffeeLocationIds = new[] { 1, 2, 3 };
        var pastryLocationIds = new[] { 1, 2, 3 };
        var saladAndQuichesLocationIds = new[] { 1, 2, 3 };
        var sandwichLocationIds = new[] { 1, 2, 3 };
        var sweetAndPopsLocationIds = new[] { 1, 2, 3 };
        var lemonadeLocationIds = new[] { 1, 2, 3 };
        var coffeeMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Iced Latte",
            "Supernova",
            "Roaring Frappe",
            "Black & White Cold Brew",
            "Sugar Shaken Espresso",
        };
        var sandwichMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "AVOCADO BAGEL",
            "AVOCADO TOAST",
            "BREAKFAST SANDWICH",
            "KALE TURKEY FOCACCIA",
            "ROAST BEEF SANDWICH",
            "VEGAN ZUCCHINI SANDWICH",
        };
        var saladAndQuichesMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Smoked Chicken Salad",
        };
        var sweetAndPopsMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "BROWNIE",
            "CARROT CAKE",
            "CHEESECAKE",
            "DOUBLE CHOCOLATE",
            "RASPBERRY SLICE",
        };
        var retiredMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Toffee Nut Latte",
            "Charcoal Latte",
            "Matcha Latte",
        };

        seededMenuItems = seededMenuItems
            .Concat(
                pastryLocationIds.SelectMany(locationId => new[]
                {
                    CreateMenuItem(
                        "CROISSANT",
                        "Pastries",
                        "Buttery layers with a crisp shell and tender center.",
                        3.50m,
                        locationId,
                        "/menu/pastries/croissant.webp",
                        280,
                        "Pastry"),
                    CreateMenuItem(
                        "BRIOCHE WITH CHOCOLATE",
                        "Pastries",
                        "Soft brioche finished with a glossy dark chocolate cap.",
                        4.95m,
                        locationId,
                        "/menu/pastries/brioche-with-chocolate.webp",
                        360,
                        "Pastry"),
                    CreateMenuItem(
                        "cinnamon roll",
                        "Pastries",
                        "Twisted cinnamon pastry with buttery layers and a rich spiced filling.",
                        4.75m,
                        locationId,
                        "/menu/pastries/cinnamon-roll.webp",
                        390,
                        "Pastry"),
                    CreateMenuItem(
                        "FOCACCIA MARINARA PIECE",
                        "Pastries",
                        "Airy focaccia square layered with marinara, olive oil, and roasted edges.",
                        5.25m,
                        locationId,
                        "/menu/pastries/focaccia-marinara-piece.webp",
                        320,
                        "Pastry"),
                }))
            .Concat(
                saladAndQuichesLocationIds.SelectMany(locationId => new[]
                {
                    CreateMenuItem(
                        "Smoked Chicken Salad",
                        "Salad & Quiches",
                        "Smoked chicken with mixed greens, apple, almonds, and dried cranberries.",
                        11.50m,
                        locationId,
                        "/menu/salads-quiches/smoked-chicken-salad.jpg",
                        430,
                        "Fresh",
                        isFeatured: locationId == 1),
                }))
            .Concat(
                sandwichLocationIds.SelectMany(locationId => new[]
                {
                    CreateMenuItem(
                        "AVOCADO BAGEL",
                        "Sandwiches & Bagels",
                        "Seeded bagel layered with avocado, cream cheese, greens, and a crisp house patty.",
                        8.25m,
                        locationId,
                        "/menu/sandwiches-bagels/avocado-bagel.webp",
                        420,
                        "Cafe Favorite",
                        isFeatured: locationId == 1),
                    CreateMenuItem(
                        "AVOCADO TOAST",
                        "Sandwiches & Bagels",
                        "Toasted sourdough with smashed avocado, herbs, and a fresh garden finish.",
                        8.50m,
                        locationId,
                        "/menu/sandwiches-bagels/avocado-toast.webp",
                        360,
                        "Brunch",
                        isFeatured: locationId == 1),
                    CreateMenuItem(
                        "BREAKFAST SANDWICH",
                        "Sandwiches & Bagels",
                        "A hearty breakfast sandwich with egg, cheese, and savory house spread.",
                        8.75m,
                        locationId,
                        "/menu/sandwiches-bagels/breakfast-sandwich.webp",
                        480,
                        "Breakfast"),
                    CreateMenuItem(
                        "KALE TURKEY FOCACCIA",
                        "Sandwiches & Bagels",
                        "Sesame focaccia stacked with roast turkey, kale, and crisp greens.",
                        9.25m,
                        locationId,
                        "/menu/sandwiches-bagels/kale-turkey-focaccia.webp",
                        520,
                        "Signature"),
                    CreateMenuItem(
                        "ROAST BEEF SANDWICH",
                        "Sandwiches & Bagels",
                        "Roast beef layered on crusty bread with bright slaw and dressed greens.",
                        10.50m,
                        locationId,
                        "/menu/sandwiches-bagels/roast-beef-sandwich.webp",
                        570,
                        "Lunch"),
                    CreateMenuItem(
                        "VEGAN ZUCCHINI SANDWICH",
                        "Sandwiches & Bagels",
                        "Grilled zucchini, greens, and pickled vegetables on seeded bread.",
                        8.95m,
                        locationId,
                        "/menu/sandwiches-bagels/vegan-zucchini-sandwich.webp",
                        390,
                        "Plant-Based"),
                }))
            .Concat(
                sweetAndPopsLocationIds.SelectMany(locationId => new[]
                {
                    CreateMenuItem(
                        "BROWNIE",
                        "Sweet and Pops",
                        "Dense chocolate brownie with a fudgy center and deep cocoa finish.",
                        5.25m,
                        locationId,
                        "/menu/cakes-sweets/brownie.webp",
                        420,
                        "Slice",
                        isFeatured: locationId == 1),
                    CreateMenuItem(
                        "CARROT CAKE",
                        "Sweet and Pops",
                        "Spiced carrot cake finished with smooth cream cheese frosting.",
                        38.00m,
                        locationId,
                        "/menu/cakes-sweets/carrot-cake.webp",
                        540,
                        "Celebration"),
                    CreateMenuItem(
                        "CHEESECAKE",
                        "Sweet and Pops",
                        "Creamy vanilla cheesecake with a buttery crust and soft finish.",
                        45.00m,
                        locationId,
                        "/menu/cakes-sweets/cheesecake.webp",
                        560,
                        "Celebration"),
                    CreateMenuItem(
                        "DOUBLE CHOCOLATE",
                        "Sweet and Pops",
                        "Rich chocolate cake layered with glossy ganache and dark cocoa notes.",
                        42.00m,
                        locationId,
                        "/menu/cakes-sweets/double-chocolate.webp",
                        610,
                        "Celebration"),
                    CreateMenuItem(
                        "RASPBERRY SLICE",
                        "Sweet and Pops",
                        "Bright raspberry cake finished with a glossy berry top and crisp base.",
                        48.00m,
                        locationId,
                        "/menu/cakes-sweets/raspberry-slice.webp",
                        580,
                        "Celebration"),
                }))
            .Concat(
                lemonadeLocationIds.SelectMany(locationId => new[]
                {
                    CreateMenuItem(
                        "Strawberry Limeade",
                        "Lemonade",
                        "Fresh lime juice blended with strawberry purée for a refreshing, tangy drink.",
                        5.00m,
                        locationId,
                        "/menu/matcha/strawberry-matcha.webp",
                        170,
                        "Limeade",
                        isFeatured: locationId == 1
                    ),
                    CreateMenuItem(
                        "Shaken Lemonade",
                        "Lemonade",
                        "Fresh lemon juice and simple syrup vigorously shaken for a bright, refreshing lemonade.",
                        5.00m,
                        locationId,
                        "/menu/matcha/matcha-mango-latte.webp",
                        150,
                        "Lemonade"
                    ),
                }))
            .Concat(
                coffeeLocationIds.SelectMany(locationId => new[]
                {
                    CreateMenuItem(
                        "Iced Latte",
                        "Coffee",
                        "Espresso and milk served over ice for a refreshing coffee drink.",
                        5.50m,
                        locationId,
                        "/menu/coffee/iced-caramel-macchiato.jpg",
                        180,
                        "Cold Drinks"),
                    CreateMenuItem(
                        "Supernova",
                        "Coffee",
                        "A unique coffee blend with a complex, balanced profile and subtle sweetness. Delicious as espresso or paired with milk.",
                        7.95m,
                        locationId,
                        "/menu/coffee/sakuna-latte.webp",
                        120,
                        "Signature Blend"),
                    CreateMenuItem(
                        "Roaring Frappe",
                        "Coffee",
                        "Cold brew, milk, and ice blended together with a signature syrup or flavor, topped with whipped cream.",
                        6.20m,
                        locationId,
                        "/menu/coffee/iced-mocha.jpg",
                        380,
                        "Blended"),
                    CreateMenuItem(
                        "Black & White Cold Brew",
                        "Coffee",
                        "Cold brew made with both dark and light roast beans, finished with a drizzle of condensed milk.",
                        5.15m,
                        locationId,
                        "/menu/coffee/cold-brew.png",
                        70,
                        "Cold Brew"),
                    CreateMenuItem(
                        "Sugar Shaken Espresso",
                        "Coffee",
                        "Espresso shaken with sugar over ice and mellowed with creamy milk.",
                        5.95m,
                        locationId,
                        "/menu/coffee/sugar-shaken-espresso.jpg",
                        170,
                        "Shaken Espresso"),
                }))
            .ToArray();

        var existingMenuItems = await dataContext.MenuItems.ToListAsync();
        var removedMenuItems = existingMenuItems
            .Where(existingItem =>
                !MenuCatalog.IsSupportedCategory(existingItem.Category)
                || (string.Equals(existingItem.Category, "Coffee", StringComparison.OrdinalIgnoreCase)
                    && !coffeeMenuNames.Contains(existingItem.Name))
                || (string.Equals(existingItem.Category, "Salad & Quiches", StringComparison.OrdinalIgnoreCase)
                    && !saladAndQuichesMenuNames.Contains(existingItem.Name))
                || (string.Equals(existingItem.Category, "Sandwiches & Bagels", StringComparison.OrdinalIgnoreCase)
                    && !sandwichMenuNames.Contains(existingItem.Name))
                || (string.Equals(existingItem.Category, "Sweet and Pops", StringComparison.OrdinalIgnoreCase)
                    && !sweetAndPopsMenuNames.Contains(existingItem.Name))
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
            .Where(x => x.Name == "Iced Latte" && coffeeLocationIds.Contains(x.LocationId))
            .GroupBy(x => x.LocationId)
            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
            .ToDictionaryAsync(x => x.LocationId, x => x.Id);
        var supernovaIds = await dataContext.MenuItems
            .Where(x => x.Name == "Supernova" && coffeeLocationIds.Contains(x.LocationId))
            .GroupBy(x => x.LocationId)
            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
            .ToDictionaryAsync(x => x.LocationId, x => x.Id);
        var roaringFrappeIds = await dataContext.MenuItems
            .Where(x => x.Name == "Roaring Frappe" && coffeeLocationIds.Contains(x.LocationId))
            .GroupBy(x => x.LocationId)
            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
            .ToDictionaryAsync(x => x.LocationId, x => x.Id);
        var blackAndWhiteColdBrewIds = await dataContext.MenuItems
            .Where(x => x.Name == "Black & White Cold Brew" && coffeeLocationIds.Contains(x.LocationId))
            .GroupBy(x => x.LocationId)
            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
            .ToDictionaryAsync(x => x.LocationId, x => x.Id);
        var sugarShakenEspressoIds = await dataContext.MenuItems
            .Where(x => x.Name == "Sugar Shaken Espresso" && coffeeLocationIds.Contains(x.LocationId))
            .GroupBy(x => x.LocationId)
            .Select(group => new { LocationId = group.Key, Id = group.Min(x => x.Id) })
            .ToDictionaryAsync(x => x.LocationId, x => x.Id);

        var seededCustomizations = new List<MenuCustomization>();

        foreach (var locationId in coffeeLocationIds)
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
                    new MenuCustomization { MenuItemId = supernovaId, GroupName = "Milk", OptionName = "Whole Milk", AdditionalPrice = 0, SortOrder = 1 },
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

            if (sugarShakenEspressoIds.TryGetValue(locationId, out var sugarShakenEspressoId))
            {
                seededCustomizations.AddRange(
                [
                    new MenuCustomization { MenuItemId = sugarShakenEspressoId, GroupName = "Espresso", OptionName = "Extra Shot", AdditionalPrice = 1.25m, SortOrder = 1 },
                ]);
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
                Name = "Free Coffee",
                Description = "Redeem 1000 points for any size coffee.",
                PointsCost = 1000,
                IsActive = true,
                TierName = "Member",
                OfferType = "Drink",
                DiscountAmount = null,
                BonusStars = 0
            },
            new Reward
            {
                Name = "Free Lemonade",
                Description = "Redeem 1250 points for any lemonade drink (up to $5.00).",
                PointsCost = 1250,
                IsActive = true,
                TierName = "Member",
                OfferType = "Drink",
                DiscountAmount = null,
                BonusStars = 0
            },
            new Reward
            {
                Name = "Free Sandwich",
                Description = "Redeem 1500 points for any sandwich or bagel item (up to $8.50).",
                PointsCost = 1500,
                IsActive = true,
                TierName = "Member",
                OfferType = "Food",
                DiscountAmount = null,
                BonusStars = 0
            },
            new Reward
            {
                Name = "Free Salad",
                Description = "Redeem 1750 points for a salad or quiche (up to $11.50).",
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
                Benefits = "Redeem a free coffee once you hit 1000 points.",
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
            ?? locationMenuItems.FirstOrDefault(x => x.Category == "Coffee")
            ?? await dataContext.MenuItems.FirstAsync();
        var sugarShakenEspresso = locationMenuItems.FirstOrDefault(x => x.Name == "Sugar Shaken Espresso")
            ?? locationMenuItems.FirstOrDefault(x => x.Category == "Coffee" && x.Id != icedMocha.Id)
            ?? icedMocha;
        var croissant = locationMenuItems.FirstOrDefault(x => x.Name == "CROISSANT")
            ?? locationMenuItems.FirstOrDefault(x => x.Category == "Pastries")
            ?? icedMocha;

        var orders = new[]
        {
            new Order
            {
                UserId = sueId,
                LocationId = locationId,
                OrderType = "pickup",
                Status = "Completed",
                Total = icedMocha.Price + (croissant.Price * 2),
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
                        MenuItemId = croissant.Id,
                        ItemName = croissant.Name,
                        Quantity = 2,
                        UnitPrice = croissant.Price,
                        Total = croissant.Price * 2,
                        Customizations = "Warmed"
                    }
                ]
            },
            new Order
            {
                UserId = sueId,
                LocationId = locationId,
                OrderType = "drive-thru",
                Status = "Ready for pickup",
                Total = sugarShakenEspresso.Price,
                PaymentStatus = "Paid",
                PickupName = "Sue",
                CreatedAt = DateTime.UtcNow.AddMinutes(-45),
                StarsEarned = 7,
                Items =
                [
                    new OrderItem
                    {
                        MenuItemId = sugarShakenEspresso.Id,
                        ItemName = sugarShakenEspresso.Name,
                        Quantity = 1,
                        UnitPrice = sugarShakenEspresso.Price,
                        Total = sugarShakenEspresso.Price,
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
                Message = "Try the Sugar Shaken Espresso and earn bonus Lions this week."
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
