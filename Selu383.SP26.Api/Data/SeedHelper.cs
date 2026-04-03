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
using Selu383.SP26.Api.Services;

namespace Selu383.SP26.Api.Data;

public static class SeedHelper
{
    private const int SeedMemberRewardPoints = 1350;

    private static readonly HashSet<string> DefaultFeaturedItemNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "Caramel Macchiato",
        "STRAWBERRY MATCHA",
        "CROISSANT",
        "BREAKFAST SANDWICH",
        "Smoked Chicken Salad",
        "BROWNIE",
    };

    private static bool IsDefaultFeaturedItem(string itemName)
    {
        return DefaultFeaturedItemNames.Contains(itemName);
    }

    private sealed record MenuCustomizationSeed(
        string GroupName,
        string OptionName,
        decimal AdditionalPrice,
        bool IsDefault,
        int SortOrder);

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
            adminUser = new User
            {
                UserName = "galkadi",
                DisplayName = "Gia Alkadi",
                Email = "galkadi@caffeinatedlions.com",
                PhoneNumber = "+19855550101",
            };
            await userManager.CreateAsync(adminUser, defaultPassword);
        }
        adminUser.DisplayName = string.IsNullOrWhiteSpace(adminUser.DisplayName) ? "Gia Alkadi" : adminUser.DisplayName;
        adminUser.Email = string.IsNullOrWhiteSpace(adminUser.Email) ? "galkadi@caffeinatedlions.com" : adminUser.Email;
        adminUser.PhoneNumber = string.IsNullOrWhiteSpace(adminUser.PhoneNumber) ? "+19855550101" : adminUser.PhoneNumber;
        await userManager.UpdateAsync(adminUser);
        if (!await userManager.IsInRoleAsync(adminUser, RoleNames.Admin))
        {
            await userManager.AddToRoleAsync(adminUser, RoleNames.Admin);
        }

        var bob = await userManager.FindByNameAsync("bob");
        if (bob == null)
        {
            bob = new User
            {
                UserName = "bob",
                DisplayName = "Bob",
                Email = "bob@caffeinatedlions.com",
                PhoneNumber = "+19855550102",
            };
            await userManager.CreateAsync(bob, defaultPassword);
        }
        bob.DisplayName = string.IsNullOrWhiteSpace(bob.DisplayName) ? "Bob" : bob.DisplayName;
        bob.Email = string.IsNullOrWhiteSpace(bob.Email) ? "bob@caffeinatedlions.com" : bob.Email;
        bob.PhoneNumber = string.IsNullOrWhiteSpace(bob.PhoneNumber) ? "+19855550102" : bob.PhoneNumber;
        await userManager.UpdateAsync(bob);
        if (!await userManager.IsInRoleAsync(bob, RoleNames.User))
        {
            await userManager.AddToRoleAsync(bob, RoleNames.User);
        }

        var sue = await userManager.FindByNameAsync("sue");
        if (sue == null)
        {
            sue = new User
            {
                UserName = "sue",
                DisplayName = "Sue",
                Email = "sue@caffeinatedlions.com",
                PhoneNumber = "+19855550103",
                Points = SeedMemberRewardPoints,
            };
            await userManager.CreateAsync(sue, defaultPassword);
        }
        sue.DisplayName = string.IsNullOrWhiteSpace(sue.DisplayName) ? "Sue" : sue.DisplayName;
        sue.Email = string.IsNullOrWhiteSpace(sue.Email) ? "sue@caffeinatedlions.com" : sue.Email;
        sue.PhoneNumber = string.IsNullOrWhiteSpace(sue.PhoneNumber) ? "+19855550103" : sue.PhoneNumber;
        sue.Points = Math.Max(sue.Points, SeedMemberRewardPoints);
        await userManager.UpdateAsync(sue);
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
                TableCount = 14
            },
            new Location
            {
                Name = "New York",
                Address = "72 E 1st St, New York, NY",
                TableCount = 18
            },
            new Location
            {
                Name = "New Orleans",
                Address = "1140 S Carrollton Ave, New Orleans, LA",
                TableCount = 22,
                ManagerId = sueManagerId
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
                IsFeatured = false,
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
        var matchaLocationIds = new[] { 1, 2, 3 };
        var coffeeMenuNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Caramel Macchiato",
            "Cold Brew",
            "Iced Caramel Macchiato",
            "Iced Mocha",
            "Sakuna Latte",
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
                        "Bakery",
                        isFeatured: locationId == 1 && IsDefaultFeaturedItem("CROISSANT")),
                    CreateMenuItem(
                        "BRIOCHE WITH CHOCOLATE",
                        "Pastries",
                        "Soft brioche finished with a glossy dark chocolate cap.",
                        4.95m,
                        locationId,
                        "/menu/pastries/brioche-with-chocolate.webp",
                        360,
                        "Bakery"),
                    CreateMenuItem(
                        "cinnamon roll",
                        "Pastries",
                        "Twisted cinnamon pastry with buttery layers and a rich spiced filling.",
                        4.75m,
                        locationId,
                        "/menu/pastries/cinnamon-roll.webp",
                        390,
                        "Bakery"),
                    CreateMenuItem(
                        "FOCACCIA MARINARA PIECE",
                        "Pastries",
                        "Airy focaccia square layered with marinara, olive oil, and roasted edges.",
                        5.25m,
                        locationId,
                        "/menu/pastries/focaccia-marinara-piece.webp",
                        320,
                        "Bakery"),
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
                        isFeatured: locationId == 1 && IsDefaultFeaturedItem("Smoked Chicken Salad")),
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
                        "Cafe Favorite"),
                    CreateMenuItem(
                        "AVOCADO TOAST",
                        "Sandwiches & Bagels",
                        "Toasted sourdough with smashed avocado, herbs, and a fresh garden finish.",
                        8.50m,
                        locationId,
                        "/menu/sandwiches-bagels/avocado-toast.webp",
                        360,
                        "Brunch"),
                    CreateMenuItem(
                        "BREAKFAST SANDWICH",
                        "Sandwiches & Bagels",
                        "A hearty breakfast sandwich with egg, cheese, and savory house spread.",
                        8.75m,
                        locationId,
                        "/menu/sandwiches-bagels/breakfast-sandwich.webp",
                        480,
                        "Breakfast",
                        isFeatured: locationId == 1 && IsDefaultFeaturedItem("BREAKFAST SANDWICH")),
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
                        isFeatured: locationId == 1 && IsDefaultFeaturedItem("BROWNIE")),
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
                matchaLocationIds.SelectMany(locationId => new[]
                {
                    CreateMenuItem(
                        "Hojicha Strawberry Latte",
                        "Matcha",
                        "Iced hojicha latte layered with strawberry, milk, and a soft matcha finish.",
                        7.25m,
                        locationId,
                        "/menu/matcha/hojicha-strawberry-latte.webp",
                        220,
                        "Seasonal Matcha"),
                    CreateMenuItem(
                        "Matcha Latte W:Matcha Foam",
                        "Matcha",
                        "Iced matcha latte topped with an extra cloud of matcha foam.",
                        7.00m,
                        locationId,
                        "/menu/matcha/matcha-latte-w-matcha-foam.webp",
                        190,
                        "Signature Matcha"),
                    CreateMenuItem(
                        "Matcha Mango Latte",
                        "Matcha",
                        "Iced matcha layered with mango puree and creamy milk.",
                        7.25m,
                        locationId,
                        "/menu/matcha/matcha-mango-latte.webp",
                        210,
                        "Fruit Matcha"),
                    CreateMenuItem(
                        "Matcha Soft Serve in Cup",
                        "Matcha",
                        "Creamy matcha soft serve with a smooth finish served in a cup.",
                        6.50m,
                        locationId,
                        "/menu/matcha/matcha-soft-serve-in-cup.webp",
                        260,
                        "Soft Serve"),
                    CreateMenuItem(
                        "STRAWBERRY MATCHA",
                        "Matcha",
                        "Iced matcha layered with milk and bright house strawberry puree.",
                        7.25m,
                        locationId,
                        "/menu/matcha/strawberry-matcha.webp",
                        215,
                        "Fruit Matcha",
                        isFeatured: locationId == 1 && IsDefaultFeaturedItem("STRAWBERRY MATCHA")),
                }))
            .Concat(
                coffeeLocationIds.SelectMany(locationId => new[]
                {
                    CreateMenuItem(
                        "Caramel Macchiato",
                        "Coffee",
                        "Layered espresso and milk with house caramel running through the glass.",
                        6.25m,
                        locationId,
                        "/menu/coffee/caramel-macchiato.webp",
                        250,
                        "Signature Latte",
                        isFeatured: locationId == 1 && IsDefaultFeaturedItem("Caramel Macchiato")),
                    CreateMenuItem(
                        "Cold Brew",
                        "Coffee",
                        "Cold-steeped coffee with a bold body and clean finish over ice.",
                        5.25m,
                        locationId,
                        "/menu/coffee/cold-brew.png",
                        30,
                        "Cold Drinks"),
                    CreateMenuItem(
                        "Iced Caramel Macchiato",
                        "Coffee",
                        "Iced espresso and milk finished with a smooth caramel cascade.",
                        6.50m,
                        locationId,
                        "/menu/coffee/iced-caramel-macchiato.jpg",
                        260,
                        "Cold Drinks"),
                    CreateMenuItem(
                        "Iced Mocha",
                        "Coffee",
                        "Chilled mocha latte topped with whipped cream and chocolate drizzle.",
                        6.25m,
                        locationId,
                        "/menu/coffee/iced-mocha.jpg",
                        320,
                        "Cold Drinks"),
                    CreateMenuItem(
                        "Sakuna Latte",
                        "Coffee",
                        "Silky iced latte layered with floral sweetness and a bright berry finish.",
                        6.95m,
                        locationId,
                        "/menu/coffee/sakuna-latte.webp",
                        240,
                        "Seasonal Latte"),
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

        var customizationTemplatesByItemName = new Dictionary<string, MenuCustomizationSeed[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["Caramel Macchiato"] =
            [
                new("Size", "12 oz", 0, true, 1),
                new("Size", "16 oz", 0.75m, false, 2),
                new("Milk", "Whole Milk", 0, true, 3),
                new("Milk", "Oatmilk", 0.75m, false, 4),
                new("Milk", "Almond Milk", 0.75m, false, 5),
                new("Espresso", "Standard Shot", 0, true, 6),
                new("Espresso", "Extra Shot", 1.25m, false, 7),
            ],
            ["Iced Mocha"] =
            [
                new("Size", "12 oz", 0, true, 1),
                new("Size", "16 oz", 0.75m, false, 2),
                new("Whipped Cream", "With Whipped Cream", 0, true, 3),
                new("Whipped Cream", "No Whipped Cream", 0, false, 4),
                new("Drizzle", "No Drizzle", 0, true, 5),
                new("Drizzle", "Chocolate Drizzle", 0.50m, false, 6),
            ],
            ["Cold Brew"] =
            [
                new("Size", "12 oz", 0, true, 1),
                new("Size", "16 oz", 0.75m, false, 2),
                new("Sweetener", "Unsweetened", 0, true, 3),
                new("Sweetener", "Vanilla Sweet Cream", 0.75m, false, 4),
                new("Sweetener", "Sugar-Free Vanilla", 0.50m, false, 5),
            ],
            ["STRAWBERRY MATCHA"] =
            [
                new("Milk", "Whole Milk", 0, true, 1),
                new("Milk", "Oatmilk", 0.75m, false, 2),
                new("Sweetness", "House Sweet", 0, true, 3),
                new("Sweetness", "Light Sweet", 0, false, 4),
                new("Sweetness", "No Added Sweetener", 0, false, 5),
            ],
            ["BREAKFAST SANDWICH"] =
            [
                new("Finish", "Standard", 0, true, 1),
                new("Finish", "Warmed", 0, false, 2),
                new("Build", "House Build", 0, true, 3),
                new("Build", "Add Avocado", 1.25m, false, 4),
            ],
            ["CROISSANT"] =
            [
                new("Finish", "Fresh Case", 0, true, 1),
                new("Finish", "Warmed", 0, false, 2),
            ],
        };

        var customizableItemNames = customizationTemplatesByItemName.Keys.ToArray();
        var customizableMenuItems = await dataContext.MenuItems
            .Where(x => customizableItemNames.Contains(x.Name))
            .Select(x => new { x.Id, x.Name })
            .ToListAsync();

        var targetMenuItemIds = customizableMenuItems
            .Select(x => x.Id)
            .ToHashSet();

        var seededCustomizations = customizableMenuItems
            .SelectMany(item => customizationTemplatesByItemName[item.Name]
                .Select(template => new MenuCustomization
                {
                    MenuItemId = item.Id,
                    GroupName = template.GroupName,
                    OptionName = template.OptionName,
                    AdditionalPrice = template.AdditionalPrice,
                    IsDefault = template.IsDefault,
                    SortOrder = template.SortOrder,
                }))
            .ToList();

        var existingCustomizations = await dataContext.MenuCustomizations
            .Where(x => targetMenuItemIds.Contains(x.MenuItemId))
            .ToListAsync();

        var customizationsToRemove = existingCustomizations
            .Where(existingCustomization => !seededCustomizations.Any(seededCustomization =>
                seededCustomization.MenuItemId == existingCustomization.MenuItemId
                && string.Equals(seededCustomization.GroupName, existingCustomization.GroupName, StringComparison.OrdinalIgnoreCase)
                && string.Equals(seededCustomization.OptionName, existingCustomization.OptionName, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        if (customizationsToRemove.Count > 0)
        {
            dataContext.MenuCustomizations.RemoveRange(customizationsToRemove);
            existingCustomizations = existingCustomizations.Except(customizationsToRemove).ToList();
        }

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
        var seededRewards = new[]
        {
            new Reward
            {
                Name = "Free Drink",
                Description = "Redeem for one free drink.",
                PointsCost = StarEarningService.RewardThreshold,
                IsActive = true,
                TierName = StarEarningService.MemberTierName,
                OfferType = "Drink"
            },
            new Reward
            {
                Name = "Free Pastry",
                Description = "Redeem for one free pastry.",
                PointsCost = StarEarningService.RewardThreshold,
                IsActive = true,
                TierName = StarEarningService.MemberTierName,
                OfferType = "Pastry"
            },
            new Reward
            {
                Name = "Free Breakfast Item",
                Description = "Redeem for one item from the breakfast menu.",
                PointsCost = StarEarningService.RewardThreshold,
                IsActive = true,
                TierName = StarEarningService.MemberTierName,
                OfferType = "Breakfast"
            },
            new Reward
            {
                Name = "Free Cake & Sweets Item",
                Description = "Redeem for one item from cakes and sweets.",
                PointsCost = StarEarningService.RewardThreshold,
                IsActive = true,
                TierName = StarEarningService.MemberTierName,
                OfferType = "Sweet"
            },
        };

        var existingRewards = await dataContext.Rewards.ToListAsync();
        var seededRewardNames = seededRewards
            .Select(x => x.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var seededReward in seededRewards)
        {
            var existingReward = existingRewards.FirstOrDefault(x =>
                string.Equals(x.Name, seededReward.Name, StringComparison.OrdinalIgnoreCase));

            if (existingReward == null)
            {
                dataContext.Set<Reward>().Add(seededReward);
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

        foreach (var existingReward in existingRewards.Where(x => !seededRewardNames.Contains(x.Name)))
        {
            existingReward.IsActive = false;
        }

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddRewardTiers(DataContext dataContext)
    {
        var seededRewardTiers = new[]
        {
            new RewardTier
            {
                Name = StarEarningService.MemberTierName,
                MinPoints = 0,
                Benefits = $"Earn {StarEarningService.PointsPerDollar} Lions per dollar and redeem {StarEarningService.RewardThreshold} Lions for a drink, pastry, breakfast item, or cake and sweets item.",
                AccentColor = "#bbc96d"
            },
        };

        var existingRewardTiers = await dataContext.RewardTiers.ToListAsync();
        var seededTierNames = seededRewardTiers
            .Select(x => x.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var seededRewardTier in seededRewardTiers)
        {
            var existingRewardTier = existingRewardTiers.FirstOrDefault(x =>
                string.Equals(x.Name, seededRewardTier.Name, StringComparison.OrdinalIgnoreCase));

            if (existingRewardTier == null)
            {
                dataContext.RewardTiers.Add(seededRewardTier);
                continue;
            }

            existingRewardTier.MinPoints = seededRewardTier.MinPoints;
            existingRewardTier.Benefits = seededRewardTier.Benefits;
            existingRewardTier.AccentColor = seededRewardTier.AccentColor;
        }

        var obsoleteRewardTiers = existingRewardTiers
            .Where(x => !seededTierNames.Contains(x.Name))
            .ToList();

        if (obsoleteRewardTiers.Count > 0)
        {
            dataContext.RewardTiers.RemoveRange(obsoleteRewardTiers);
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
            .Where(x => x.Name.Contains("New Orleans"))
            .Select(x => x.Id)
            .FirstAsync();

        var locationMenuItems = await dataContext.MenuItems
            .Where(x => x.LocationId == locationId)
            .ToListAsync();

        var icedMocha = locationMenuItems.FirstOrDefault(x => x.Name == "Iced Mocha")
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
                CardLastFour = "1111",
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
