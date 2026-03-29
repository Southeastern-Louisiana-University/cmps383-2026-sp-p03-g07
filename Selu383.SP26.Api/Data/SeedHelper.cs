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
        await AddGiftCards(dataContext);
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
            sue = new User { UserName = "sue", Points = 80 };
            await userManager.CreateAsync(sue, defaultPassword);
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
                Address = "110 N Cate St, Hammond, LA 70403",
                TableCount = 10
            },
            new Location
            {
                Name = "New York",
                Address = "72 E 1st St, New York, NY 10003",
                TableCount = 20,
                ManagerId = sueManagerId
            },
            new Location
            {
                Name = "New Orleans",
                Address = "1140 S Carrollton Ave, New Orleans, LA 70118",
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

        var locationIds = new[] { 1, 2, 3 };

        var drinkNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Iced Latte", "Supernova", "Roaring Frappe", "Black & White Cold Brew",
            "Strawberry Limeade", "Shaken Lemonade"
        };
        var sweetCrepeNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Mannino Honey Crepe", "Downtowner", "Funky Monkey", "Le S'mores",
            "Strawberry Fields", "Bonjour", "Banana Foster"
        };
        var savoryCrepeNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Matt's Scrambled Eggs", "Meanie Mushroom", "Turkey Club", "Green Machine",
            "Perfect Pair", "Crepe Fromage", "Farmers Market Crepe"
        };
        var bagelNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Travis Special", "Creme Brulagel", "The Fancy One", "Breakfast Bagel", "The Classic"
        };

        var seededMenuItems = locationIds.SelectMany(locationId => new[]
        {
            // --- DRINKS ---
            CreateMenuItem("Iced Latte", "Drinks",
                "Espresso and milk served over ice for a refreshing coffee drink.",
                5.50m, locationId, "/menu/coffee/iced-caramel-macchiato.jpg", 180, "Cold Drinks",
                isFeatured: locationId == 1),
            CreateMenuItem("Supernova", "Drinks",
                "A unique coffee blend with a complex, balanced profile and subtle sweetness. Delicious as espresso or paired with milk.",
                7.95m, locationId, "/menu/coffee/sugar-shaken-espresso.jpg", 200, "Signature",
                isFeatured: locationId == 1),
            CreateMenuItem("Roaring Frappe", "Drinks",
                "Cold brew, milk, and ice blended together with a signature syrup or flavor, topped with whipped cream.",
                6.20m, locationId, "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80", 310, "Frappe",
                isFeatured: locationId == 1),
            CreateMenuItem("Black & White Cold Brew", "Drinks",
                "Cold brew made with both dark and light roast beans, finished with a drizzle of condensed milk.",
                5.15m, locationId, "/menu/coffee/cold-brew.png", 80, "Cold Brew"),
            CreateMenuItem("Strawberry Limeade", "Drinks",
                "Fresh lime juice blended with strawberry puree for a refreshing, tangy drink.",
                5.00m, locationId, "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80", 160, "Refresher"),
            CreateMenuItem("Shaken Lemonade", "Drinks",
                "Fresh lemon juice and simple syrup vigorously shaken for a bright, refreshing lemonade.",
                5.00m, locationId, "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80", 140, "Refresher"),

            // --- SWEET CREPES ---
            CreateMenuItem("Mannino Honey Crepe", "Sweet Crepes",
                "A sweet crepe drizzled with Mannino honey and topped with mixed berries.",
                10.00m, locationId, "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=400&q=80", 420, "Sweet",
                isFeatured: locationId == 1),
            CreateMenuItem("Downtowner", "Sweet Crepes",
                "Strawberries and bananas wrapped in a crepe, finished with Nutella and Hershey's chocolate sauce.",
                10.75m, locationId, "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=400&q=80", 560, "Sweet"),
            CreateMenuItem("Funky Monkey", "Sweet Crepes",
                "Nutella and bananas wrapped in a crepe, served with whipped cream.",
                10.00m, locationId, "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=400&q=80", 490, "Sweet"),
            CreateMenuItem("Le S'mores", "Sweet Crepes",
                "Marshmallow cream and chocolate sauce inside a crepe, topped with graham cracker crumbs.",
                9.50m, locationId, "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=400&q=80", 510, "Sweet"),
            CreateMenuItem("Strawberry Fields", "Sweet Crepes",
                "Fresh strawberries with Hershey's chocolate drizzle and a dusting of powdered sugar.",
                10.00m, locationId, "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=400&q=80", 400, "Sweet"),
            CreateMenuItem("Bonjour", "Sweet Crepes",
                "A sweet crepe filled with syrup and cinnamon, finished with powdered sugar.",
                8.50m, locationId, "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=400&q=80", 360, "Classic"),
            CreateMenuItem("Banana Foster", "Sweet Crepes",
                "Bananas with cinnamon in a crepe, topped with a generous drizzle of caramel sauce.",
                8.95m, locationId, "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=400&q=80", 440, "Sweet"),

            // --- SAVORY CREPES ---
            CreateMenuItem("Matt's Scrambled Eggs", "Savory Crepes",
                "Scrambled eggs and melted mozzarella cheese wrapped in a crepe.",
                5.00m, locationId, "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=400&q=80", 310, "Breakfast"),
            CreateMenuItem("Meanie Mushroom", "Savory Crepes",
                "Sauteed mushrooms, mozzarella, tomato, and bacon inside a delicate crepe.",
                10.50m, locationId, "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=400&q=80", 480, "Savory"),
            CreateMenuItem("Turkey Club", "Savory Crepes",
                "Sliced turkey, bacon, spinach, and tomato wrapped in a savory crepe.",
                10.50m, locationId, "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=400&q=80", 520, "Savory",
                isFeatured: locationId == 1),
            CreateMenuItem("Green Machine", "Savory Crepes",
                "Spinach, artichokes, and mozzarella cheese inside a fresh crepe.",
                10.00m, locationId, "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=400&q=80", 390, "Veggie"),
            CreateMenuItem("Perfect Pair", "Savory Crepes",
                "A unique combination of bacon and Nutella wrapped in a crepe.",
                10.00m, locationId, "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=400&q=80", 460, "Savory"),
            CreateMenuItem("Crepe Fromage", "Savory Crepes",
                "A savory crepe filled with a blend of cheeses.",
                8.00m, locationId, "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=400&q=80", 350, "Classic"),
            CreateMenuItem("Farmers Market Crepe", "Savory Crepes",
                "Turkey, spinach, and mozzarella wrapped in a savory crepe.",
                10.50m, locationId, "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=400&q=80", 470, "Fresh"),

            // --- BAGELS ---
            CreateMenuItem("Travis Special", "Bagels",
                "Cream cheese, salmon, spinach, and a fried egg served on a freshly toasted bagel.",
                14.00m, locationId, "https://images.unsplash.com/photo-1509442234563-cbde5c2fa0a0?auto=format&fit=crop&w=400&q=80", 580, "Signature",
                isFeatured: locationId == 1),
            CreateMenuItem("Creme Brulagel", "Bagels",
                "A toasted bagel with a caramelized sugar crust inspired by creme brulee, served with cream cheese.",
                8.00m, locationId, "https://images.unsplash.com/photo-1509442234563-cbde5c2fa0a0?auto=format&fit=crop&w=400&q=80", 420, "Sweet"),
            CreateMenuItem("The Fancy One", "Bagels",
                "Smoked salmon, cream cheese, and fresh dill on a toasted bagel.",
                13.00m, locationId, "https://images.unsplash.com/photo-1509442234563-cbde5c2fa0a0?auto=format&fit=crop&w=400&q=80", 510, "Signature"),
            CreateMenuItem("Breakfast Bagel", "Bagels",
                "A toasted bagel with your choice of ham, bacon, or sausage, a fried egg, and cheddar cheese.",
                9.50m, locationId, "https://images.unsplash.com/photo-1509442234563-cbde5c2fa0a0?auto=format&fit=crop&w=400&q=80", 540, "Breakfast"),
            CreateMenuItem("The Classic", "Bagels",
                "A toasted bagel with cream cheese.",
                5.25m, locationId, "https://images.unsplash.com/photo-1509442234563-cbde5c2fa0a0?auto=format&fit=crop&w=400&q=80", 310, "Classic"),
        }).ToArray();

        var existingMenuItems = await dataContext.MenuItems.ToListAsync();
        var removedMenuItems = existingMenuItems
            .Where(existingItem => !MenuCatalog.IsSupportedCategory(existingItem.Category))
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

        var icedLatteId = await dataContext.MenuItems
            .Where(x => x.Name == "Iced Latte" && x.LocationId == 1)
            .Select(x => x.Id)
            .FirstOrDefaultAsync();
        var roaringFrappeId = await dataContext.MenuItems
            .Where(x => x.Name == "Roaring Frappe" && x.LocationId == 1)
            .Select(x => x.Id)
            .FirstOrDefaultAsync();
        var coldBrewId = await dataContext.MenuItems
            .Where(x => x.Name == "Black & White Cold Brew" && x.LocationId == 1)
            .Select(x => x.Id)
            .FirstOrDefaultAsync();

        var seededCustomizations = new List<MenuCustomization>();
        if (icedLatteId > 0)
        {
            seededCustomizations.AddRange([
                new MenuCustomization { MenuItemId = icedLatteId, GroupName = "Milk", OptionName = "Whole Milk", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
                new MenuCustomization { MenuItemId = icedLatteId, GroupName = "Milk", OptionName = "Oat Milk", AdditionalPrice = 0.75m, SortOrder = 2 },
                new MenuCustomization { MenuItemId = icedLatteId, GroupName = "Milk", OptionName = "Almond Milk", AdditionalPrice = 0.75m, SortOrder = 3 },
                new MenuCustomization { MenuItemId = icedLatteId, GroupName = "Espresso", OptionName = "Extra Shot", AdditionalPrice = 1.25m, SortOrder = 4 },
            ]);
        }
        if (roaringFrappeId > 0)
        {
            seededCustomizations.AddRange([
                new MenuCustomization { MenuItemId = roaringFrappeId, GroupName = "Toppings", OptionName = "Whipped Cream", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
                new MenuCustomization { MenuItemId = roaringFrappeId, GroupName = "Flavor", OptionName = "Vanilla", AdditionalPrice = 0, IsDefault = true, SortOrder = 2 },
                new MenuCustomization { MenuItemId = roaringFrappeId, GroupName = "Flavor", OptionName = "Caramel", AdditionalPrice = 0.50m, SortOrder = 3 },
                new MenuCustomization { MenuItemId = roaringFrappeId, GroupName = "Flavor", OptionName = "Mocha", AdditionalPrice = 0.50m, SortOrder = 4 },
            ]);
        }
        if (coldBrewId > 0)
        {
            seededCustomizations.AddRange([
                new MenuCustomization { MenuItemId = coldBrewId, GroupName = "Sweetener", OptionName = "Vanilla Sweet Cream", AdditionalPrice = 0.75m, SortOrder = 1 },
                new MenuCustomization { MenuItemId = coldBrewId, GroupName = "Sweetener", OptionName = "Plain (No Sweetener)", AdditionalPrice = 0, IsDefault = true, SortOrder = 2 },
            ]);
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
                IsActive = true,
                TierName = "Bronze",
                OfferType = "Drink"
            },
            new Reward
            {
                Name = "Free Pastry",
                Description = "Get any pastry item for free",
                PointsCost = 75,
                IsActive = true,
                TierName = "Bronze",
                OfferType = "Food"
            },
            new Reward
            {
                Name = "$5 Off Purchase",
                Description = "$5 discount on your next order",
                PointsCost = 150,
                IsActive = true,
                TierName = "Silver",
                OfferType = "Discount",
                DiscountAmount = 5m
            },
            new Reward
            {
                Name = "Free Drink Upgrade",
                Description = "Upgrade any drink to large size",
                PointsCost = 50,
                IsActive = true,
                TierName = "Bronze",
                OfferType = "Upgrade"
            },
            new Reward
            {
                Name = "Double Lions Weekend",
                Description = "Bank bonus Lions on your next mobile order",
                PointsCost = 180,
                IsActive = true,
                TierName = "Gold",
                OfferType = "Lions",
                BonusStars = 50
            }
        );

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddRewardTiers(DataContext dataContext)
    {
        if (await dataContext.RewardTiers.AnyAsync())
        {
            return;
        }

        dataContext.RewardTiers.AddRange(
            new RewardTier
            {
                Name = "Bronze",
                MinPoints = 0,
                Benefits = "Birthday treat and basic earn rate",
                AccentColor = "#9a6b3a"
            },
            new RewardTier
            {
                Name = "Silver",
                MinPoints = 150,
                Benefits = "1.5x Lions, early seasonal access",
                AccentColor = "#7c8a99"
            },
            new RewardTier
            {
                Name = "Gold",
                MinPoints = 300,
                Benefits = "2x Lions, premium offers, surprise drops",
                AccentColor = "#d7a526"
            }
        );

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
            .Where(x => x.Name.Contains("New York"))
            .Select(x => x.Id)
            .FirstAsync();

        var locationMenuItems = await dataContext.MenuItems
            .Where(x => x.LocationId == locationId)
            .ToListAsync();

        var icedMocha = locationMenuItems.FirstOrDefault(x => x.Name == "Iced Latte")
            ?? locationMenuItems.FirstOrDefault(x => x.Category == "Drinks")
            ?? await dataContext.MenuItems.FirstAsync();
        var sugarShakenEspresso = locationMenuItems.FirstOrDefault(x => x.Name == "Supernova")
            ?? locationMenuItems.FirstOrDefault(x => x.Category == "Drinks" && x.Id != icedMocha.Id)
            ?? icedMocha;
        var croissant = locationMenuItems.FirstOrDefault(x => x.Name == "Turkey Club")
            ?? locationMenuItems.FirstOrDefault(x => x.Category == "Savory Crepes")
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
                Method = "GiftCard",
                Status = "Approved",
                ProviderReference = "LION-SEED-1001",
                CreatedAt = orders[1].CreatedAt
            }
        );

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddGiftCards(DataContext dataContext)
    {
        if (await dataContext.GiftCards.AnyAsync())
        {
            return;
        }

        var sueId = await dataContext.Users
            .Where(x => x.UserName == "sue")
            .Select(x => x.Id)
            .FirstAsync();

        dataContext.GiftCards.AddRange(
            new GiftCard
            {
                Code = "LION-SEED-1001",
                InitialBalance = 50m,
                Balance = 18.50m,
                IsActive = true,
                PurchasedByUserId = sueId,
                PurchasedAt = DateTime.UtcNow.AddDays(-10)
            },
            new GiftCard
            {
                Code = "LION-SEED-2002",
                InitialBalance = 25m,
                Balance = 25m,
                IsActive = true,
                PurchasedByUserId = sueId,
                PurchasedAt = DateTime.UtcNow.AddDays(-2)
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
