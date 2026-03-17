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
            adminUser = new User
            {
                UserName = "galkadi"
            };
            await userManager.CreateAsync(adminUser, defaultPassword);
            await userManager.AddToRoleAsync(adminUser, RoleNames.Admin);
        }

        var bob = await userManager.FindByNameAsync("bob");
        if (bob == null)
        {
            bob = new User
            {
                UserName = "bob"
            };
            await userManager.CreateAsync(bob, defaultPassword);
            await userManager.AddToRoleAsync(bob, RoleNames.User);
        }

        var sue = await userManager.FindByNameAsync("sue");
        if (sue == null)
        {
            sue = new User
            {
                UserName = "sue",
                Points = 80
            };
            await userManager.CreateAsync(sue, defaultPassword);
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
                Address = "123 Main St, Hammond, LA",
                TableCount = 10
            },
            new Location
            {
                Name = "Covington",
                Address = "456 Oak Ave, Covington, LA",
                TableCount = 20,
                ManagerId = sueManagerId
            },
            new Location
            {
                Name = "Baton Rouge",
                Address = "789 Pine Ln, Baton Rouge, LA",
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
                Name = "Latte",
                Category = "Coffee",
                Description = "Velvety espresso with steamed milk and microfoam.",
                Price = 4.50m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80",
                Calories = 190,
                IsFeatured = true,
                InventoryCount = 12,
                PreparationTag = "Espresso Based"
            },
            new MenuItem
            {
                Name = "Cold Brew",
                Category = "Coffee",
                Description = "Slow-steeped coffee with a bold, smooth finish.",
                Price = 4.00m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80",
                Calories = 110,
                IsFeatured = true,
                InventoryCount = 10,
                PreparationTag = "Cold Drinks"
            },
            new MenuItem
            {
                Name = "Blueberry Muffin",
                Category = "Sandwiches & Bagels",
                Description = "Baked fresh with Louisiana blueberries and lemon sugar.",
                Price = 3.25m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
                Calories = 320,
                InventoryCount = 7,
                PreparationTag = "Bakery"
            },
            new MenuItem
            {
                Name = "Mocha",
                Category = "Coffee",
                Description = "Chocolate espresso with whipped cream and cocoa dust.",
                Price = 4.75m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
                Calories = 260,
                IsFeatured = true,
                InventoryCount = 8,
                PreparationTag = "Specialty"
            },
            new MenuItem
            {
                Name = "Croissant",
                Category = "Sandwiches & Bagels",
                Description = "Buttery layers with a crisp shell and tender center.",
                Price = 3.50m,
                IsAvailable = true,
                LocationId = 2,
                ImageUrl = "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
                Calories = 280,
                InventoryCount = 4,
                PreparationTag = "Bakery"
            },
            new MenuItem
            {
                Name = "Iced Coffee",
                Category = "Coffee",
                Description = "Freshly brewed coffee over ice with optional sweet cream.",
                Price = 3.75m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80",
                Calories = 95,
                InventoryCount = 6,
                PreparationTag = "Cold Drinks"
            },
            new MenuItem
            {
                Name = "Brown Sugar Shaker",
                Category = "Coffee",
                Description = "Espresso shaken with brown sugar and oatmilk.",
                Price = 5.25m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80",
                Calories = 210,
                IsFeatured = true,
                InventoryCount = 9,
                PreparationTag = "Flavored Lattes"
            },
            new MenuItem
            {
                Name = "Turkey Pesto Panini",
                Category = "Sandwiches & Bagels",
                Description = "Warm pressed sandwich with provolone and basil pesto.",
                Price = 7.95m,
                IsAvailable = true,
                LocationId = 3,
                ImageUrl = "https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=400&q=80",
                Calories = 540,
                InventoryCount = 3,
                PreparationTag = "Lunch"
            },
            new MenuItem
            {
                Name = "Avocado Toast",
                Category = "Sandwiches & Bagels",
                Description = "Sourdough toast layered with smashed avocado, chili flakes, and citrus salt.",
                Price = 8.25m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=400&q=80",
                Calories = 360,
                IsFeatured = true,
                InventoryCount = 6,
                PreparationTag = "Brunch"
            },
            new MenuItem
            {
                Name = "Avocado Bagel",
                Category = "Sandwiches & Bagels",
                Description = "Toasted bagel with avocado spread, greens, and cracked pepper.",
                Price = 7.95m,
                IsAvailable = true,
                LocationId = 2,
                ImageUrl = "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80",
                Calories = 410,
                InventoryCount = 7,
                PreparationTag = "Cafe Favorite"
            },
            new MenuItem
            {
                Name = "KALE TURKEY FOCACCIA",
                Category = "Sandwiches & Bagels",
                Description = "Focaccia stacked with roast turkey, kale slaw, and herb mayo.",
                Price = 9.25m,
                IsAvailable = true,
                LocationId = 3,
                ImageUrl = "https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=400&q=80",
                Calories = 520,
                InventoryCount = 5,
                PreparationTag = "Signature"
            },
            new MenuItem
            {
                Name = "VEGANES ZUCCHINI SANDWICH",
                Category = "Sandwiches & Bagels",
                Description = "Grilled zucchini, hummus, greens, and pickled onions on seeded bread.",
                Price = 8.95m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1606491956391-652cf14b085e?auto=format&fit=crop&w=400&q=80",
                Calories = 390,
                InventoryCount = 6,
                PreparationTag = "Plant-Based"
            },
            new MenuItem
            {
                Name = "ROASTBEEF STIRATO",
                Category = "Sandwiches & Bagels",
                Description = "Roast beef, arugula, provolone, and mustard aioli on crispy stirato bread.",
                Price = 10.50m,
                IsAvailable = true,
                LocationId = 2,
                ImageUrl = "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80",
                Calories = 570,
                InventoryCount = 4,
                PreparationTag = "Lunch"
            },
            new MenuItem
            {
                Name = "FRÜHSTÜCKSANDWICH",
                Category = "Sandwiches & Bagels",
                Description = "Breakfast sandwich with egg, cheese, and savory spread on a warm roll.",
                Price = 8.50m,
                IsAvailable = true,
                LocationId = 3,
                ImageUrl = "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80",
                Calories = 480,
                IsFeatured = true,
                InventoryCount = 5,
                PreparationTag = "Breakfast"
            },
            new MenuItem
            {
                Name = "Spinach Feta Quiche",
                Category = "Salad & Quiches",
                Description = "Savory quiche with roasted spinach, feta, and a flaky crust.",
                Price = 6.50m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=400&q=80",
                Calories = 420,
                IsFeatured = true,
                InventoryCount = 5,
                PreparationTag = "Brunch"
            },
            new MenuItem
            {
                Name = "Caesar Salad",
                Category = "Salad & Quiches",
                Description = "Crisp romaine, parmesan, sourdough crumbs, and a bright Caesar dressing.",
                Price = 8.95m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=400&q=80",
                Calories = 320,
                IsFeatured = true,
                InventoryCount = 6,
                PreparationTag = "Fresh"
            },
            new MenuItem
            {
                Name = "Pea and Pecorino Salad",
                Category = "Salad & Quiches",
                Description = "Sweet peas, pecorino, greens, and herbs finished with lemon and olive oil.",
                Price = 9.25m,
                IsAvailable = true,
                LocationId = 2,
                ImageUrl = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
                Calories = 290,
                InventoryCount = 5,
                PreparationTag = "Seasonal"
            },
            new MenuItem
            {
                Name = "Quiche du Marché",
                Category = "Salad & Quiches",
                Description = "Market-style quiche with rotating vegetables, herbs, and a buttery crust.",
                Price = 7.50m,
                IsAvailable = true,
                LocationId = 3,
                ImageUrl = "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=400&q=80",
                Calories = 430,
                InventoryCount = 4,
                PreparationTag = "Market Special"
            },
            new MenuItem
            {
                Name = "QUICHE LORRAINE",
                Category = "Salad & Quiches",
                Description = "Classic Lorraine quiche with smoked bacon, custard, and gruyere.",
                Price = 7.95m,
                IsAvailable = true,
                LocationId = 2,
                ImageUrl = "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=400&q=80",
                Calories = 470,
                InventoryCount = 4,
                PreparationTag = "Classic"
            },
            new MenuItem
            {
                Name = "Citrus Kale Salad",
                Category = "Salad & Quiches",
                Description = "Kale, shaved parmesan, citrus, and toasted seeds with lemon vinaigrette.",
                Price = 7.25m,
                IsAvailable = true,
                LocationId = 2,
                ImageUrl = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
                Calories = 260,
                InventoryCount = 6,
                PreparationTag = "Fresh"
            },
            new MenuItem
            {
                Name = "RASPBERRY SLICE ROUND",
                Category = "Sweet and Pops",
                Description = "Celebration raspberry cake with bright berry filling and a smooth finish.",
                Price = 55.00m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=400&q=80",
                Calories = 620,
                IsFeatured = true,
                InventoryCount = 2,
                PreparationTag = "Celebration"
            },
            new MenuItem
            {
                Name = "CARROT CAKE",
                Category = "Sweet and Pops",
                Description = "Moist carrot cake with warm spices and cream cheese frosting.",
                Price = 38.00m,
                IsAvailable = true,
                LocationId = 2,
                ImageUrl = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
                Calories = 540,
                InventoryCount = 3,
                PreparationTag = "From"
            },
            new MenuItem
            {
                Name = "CHEESECAKE",
                Category = "Sweet and Pops",
                Description = "Rich vanilla cheesecake with a buttery crust and silky texture.",
                Price = 45.00m,
                IsAvailable = true,
                LocationId = 3,
                ImageUrl = "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80",
                Calories = 560,
                InventoryCount = 3,
                PreparationTag = "From"
            },
            new MenuItem
            {
                Name = "CHOCOLATE CAKE",
                Category = "Sweet and Pops",
                Description = "Deep chocolate cake layered with glossy ganache and soft crumb.",
                Price = 38.00m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=400&q=80",
                Calories = 590,
                InventoryCount = 4,
                PreparationTag = "From"
            },
            new MenuItem
            {
                Name = "POPPY SEED CAKE",
                Category = "Sweet and Pops",
                Description = "Tender poppy seed loaf with citrus glaze and a delicate crumb.",
                Price = 32.00m,
                IsAvailable = true,
                LocationId = 2,
                ImageUrl = "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=400&q=80",
                Calories = 470,
                InventoryCount = 4,
                PreparationTag = "From"
            },
            new MenuItem
            {
                Name = "BANANA BREAD",
                Category = "Sweet and Pops",
                Description = "Classic banana bread baked with brown sugar and toasted pecans.",
                Price = 14.50m,
                IsAvailable = true,
                LocationId = 3,
                ImageUrl = "https://images.unsplash.com/photo-1605286978633-2dec93ff88a2?auto=format&fit=crop&w=400&q=80",
                Calories = 380,
                InventoryCount = 6,
                PreparationTag = "From"
            },
            new MenuItem
            {
                Name = "LEMON CAKE",
                Category = "Sweet and Pops",
                Description = "Bright lemon cake with a soft crumb and glossy citrus icing.",
                Price = 16.50m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=400&q=80",
                Calories = 360,
                InventoryCount = 5,
                PreparationTag = "From"
            },
            new MenuItem
            {
                Name = "STREUSEL CAKE SLICE",
                Category = "Sweet and Pops",
                Description = "Crumb-topped cake slice with buttery streusel and cinnamon notes.",
                Price = 6.50m,
                IsAvailable = true,
                LocationId = 2,
                ImageUrl = "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=400&q=80",
                Calories = 310,
                InventoryCount = 7,
                PreparationTag = "Slice"
            },
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
                Description = "Branded ceramic mug with the house olive-and-gold storefront palette.",
                Price = 16.00m,
                IsAvailable = true,
                LocationId = 1,
                ImageUrl = "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=400&q=80",
                Calories = 0,
                InventoryCount = 8,
                PreparationTag = "Merch"
            }
        };

        seededMenuItems = seededMenuItems.Concat(
            new[]
            {
                CreateMenuItem(
                    "Espresso",
                    "Coffee",
                    "A concentrated shot with caramel sweetness and a velvety finish.",
                    3.25m,
                    1,
                    "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80",
                    15,
                    "Espresso Based"),
                CreateMenuItem(
                    "Double Espresso (Doppio)",
                    "Coffee",
                    "Two bold espresso shots pulled for extra body and depth.",
                    4.25m,
                    1,
                    "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80",
                    25,
                    "Espresso Based"),
                CreateMenuItem(
                    "Americano",
                    "Coffee",
                    "Espresso lengthened with hot water for a clean, balanced cup.",
                    4.00m,
                    1,
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80",
                    20,
                    "Espresso Based"),
                CreateMenuItem(
                    "Cappuccino",
                    "Coffee",
                    "Equal parts espresso, steamed milk, and airy foam.",
                    4.75m,
                    1,
                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
                    140,
                    "Espresso Based"),
                CreateMenuItem(
                    "Flat White",
                    "Coffee",
                    "Silky microfoam folded into espresso for a smooth, strong cup.",
                    5.00m,
                    1,
                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
                    160,
                    "Espresso Based"),
                CreateMenuItem(
                    "Macchiato",
                    "Coffee",
                    "Espresso marked with a spoonful of foam for a bold finish.",
                    4.25m,
                    1,
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80",
                    60,
                    "Espresso Based"),
                CreateMenuItem(
                    "Cortado",
                    "Coffee",
                    "Espresso softened with warm milk in equal measure.",
                    4.75m,
                    1,
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80",
                    110,
                    "Espresso Based"),
                CreateMenuItem(
                    "Ristretto",
                    "Coffee",
                    "A shorter pull with intense sweetness, body, and crema.",
                    3.50m,
                    1,
                    "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80",
                    10,
                    "Espresso Based"),
                CreateMenuItem(
                    "Long Black",
                    "Coffee",
                    "Hot water topped with espresso for a rich crema-led cup.",
                    4.25m,
                    1,
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80",
                    18,
                    "Espresso Based"),
                CreateMenuItem(
                    "Vanilla Latte",
                    "Coffee",
                    "House vanilla syrup melted into espresso and steamed milk.",
                    5.75m,
                    1,
                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
                    240,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "Caramel Latte",
                    "Coffee",
                    "Steamed milk latte layered with buttery caramel notes.",
                    5.95m,
                    1,
                    "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80",
                    250,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "Hazelnut Latte",
                    "Coffee",
                    "Smooth espresso latte finished with roasted hazelnut syrup.",
                    5.95m,
                    1,
                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
                    245,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "Brown Sugar Oat Latte",
                    "Coffee",
                    "Espresso, brown sugar, and creamy oatmilk shaken smooth.",
                    6.25m,
                    1,
                    "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80",
                    220,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "Cinnamon Dolce Latte",
                    "Coffee",
                    "Warm cinnamon syrup and velvety milk with espresso.",
                    6.25m,
                    1,
                    "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80",
                    255,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "Lavender Latte",
                    "Coffee",
                    "Espresso brightened with floral lavender and silky milk.",
                    6.50m,
                    1,
                    "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=400&q=80",
                    230,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "Honey Oat Latte",
                    "Coffee",
                    "Oatmilk latte sweetened with golden honey and espresso.",
                    6.25m,
                    1,
                    "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80",
                    225,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "Pumpkin Spice Latte",
                    "Coffee",
                    "Fall spice blend with espresso, milk, and pumpkin sweetness.",
                    6.75m,
                    1,
                    "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80",
                    290,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "Toffee Nut Latte",
                    "Coffee",
                    "Toffee sweetness and toasted nut notes over espresso.",
                    6.50m,
                    1,
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80",
                    260,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "White Chocolate Mocha",
                    "Coffee",
                    "White chocolate sauce blended with espresso and steamed milk.",
                    6.75m,
                    1,
                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
                    310,
                    "Flavored Lattes"),
                CreateMenuItem(
                    "Iced Americano",
                    "Coffee",
                    "Espresso over chilled water and ice for a crisp finish.",
                    4.25m,
                    1,
                    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80",
                    20,
                    "Cold Drinks"),
                CreateMenuItem(
                    "Iced Latte",
                    "Coffee",
                    "Cold espresso and milk poured over ice for easy sipping.",
                    5.25m,
                    1,
                    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80",
                    170,
                    "Cold Drinks"),
                CreateMenuItem(
                    "Nitro Cold Brew",
                    "Coffee",
                    "Nitrogen-infused cold brew with a creamy cascading head.",
                    5.75m,
                    1,
                    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80",
                    15,
                    "Cold Drinks"),
                CreateMenuItem(
                    "Iced Macchiato",
                    "Coffee",
                    "Layered espresso, milk, and ice with a bold top note.",
                    5.50m,
                    1,
                    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80",
                    160,
                    "Cold Drinks"),
                CreateMenuItem(
                    "Iced Caramel Macchiato",
                    "Coffee",
                    "Iced milk and espresso finished with caramel drizzle.",
                    6.25m,
                    1,
                    "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80",
                    240,
                    "Cold Drinks"),
                CreateMenuItem(
                    "Shaken Espresso",
                    "Coffee",
                    "Espresso shaken over ice for a frothy, lively texture.",
                    5.75m,
                    1,
                    "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&q=80",
                    120,
                    "Cold Drinks"),
                CreateMenuItem(
                    "Frappuccino",
                    "Coffee",
                    "Blended iced coffee drink with creamy sweetness and whip.",
                    6.50m,
                    1,
                    "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80",
                    360,
                    "Cold Drinks"),
                CreateMenuItem(
                    "Iced Mocha",
                    "Coffee",
                    "Chocolate espresso chilled over ice with milk and cocoa.",
                    6.00m,
                    1,
                    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80",
                    260,
                    "Cold Drinks"),
                CreateMenuItem(
                    "Cold Foam Latte",
                    "Coffee",
                    "Iced latte topped with a fluffy cloud of vanilla cold foam.",
                    6.00m,
                    1,
                    "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80",
                    210,
                    "Cold Drinks"),
                CreateMenuItem(
                    "Affogato",
                    "Coffee",
                    "A hot espresso shot poured over cool vanilla gelato.",
                    6.50m,
                    1,
                    "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80",
                    210,
                    "Specialty"),
                CreateMenuItem(
                    "Vienna Coffee",
                    "Coffee",
                    "Dark coffee topped with lightly sweetened whipped cream.",
                    5.50m,
                    1,
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80",
                    190,
                    "Specialty"),
                CreateMenuItem(
                    "Irish Coffee",
                    "Coffee",
                    "Cafe-style Irish coffee with whipped cream and warming notes.",
                    8.50m,
                    1,
                    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80",
                    220,
                    "Specialty"),
                CreateMenuItem(
                    "Dalgona Coffee",
                    "Coffee",
                    "Whipped coffee cloud served over chilled milk and ice.",
                    5.75m,
                    1,
                    "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80",
                    180,
                    "Specialty"),
                CreateMenuItem(
                    "Dirty Chai Latte",
                    "Coffee",
                    "Spiced chai latte lifted with a shot of espresso.",
                    6.50m,
                    1,
                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
                    230,
                    "Specialty"),
                CreateMenuItem(
                    "Matcha Latte",
                    "Coffee",
                    "Ceremonial-style matcha whisked into creamy steamed milk.",
                    6.25m,
                    1,
                    "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=400&q=80",
                    170,
                    "Specialty"),
                CreateMenuItem(
                    "Turmeric Latte",
                    "Coffee",
                    "Golden milk latte with turmeric, ginger, and black pepper.",
                    6.00m,
                    1,
                    "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=400&q=80",
                    160,
                    "Specialty"),
                CreateMenuItem(
                    "Charcoal Latte",
                    "Coffee",
                    "Silky black latte with toasted vanilla and espresso notes.",
                    6.25m,
                    1,
                    "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80",
                    180,
                    "Specialty"),
                CreateMenuItem(
                    "Rose Latte",
                    "Coffee",
                    "Floral rose syrup balanced with espresso and steamed milk.",
                    6.50m,
                    1,
                    "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=400&q=80",
                    220,
                    "Specialty")
            })
            .ToArray();

        var existingMenuItems = await dataContext.MenuItems.ToListAsync();

        foreach (var seededMenuItem in seededMenuItems)
        {
            var existingMenuItem = existingMenuItems.FirstOrDefault(x => x.Name == seededMenuItem.Name);

            if (existingMenuItem == null)
            {
                dataContext.Set<MenuItem>().Add(seededMenuItem);
                continue;
            }

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

        if (await dataContext.MenuCustomizations.AnyAsync())
        {
            return;
        }

        var latteId = await dataContext.MenuItems.Where(x => x.Name == "Latte").Select(x => x.Id).FirstAsync();
        var mochaId = await dataContext.MenuItems.Where(x => x.Name == "Mocha").Select(x => x.Id).FirstAsync();
        var coldBrewId = await dataContext.MenuItems.Where(x => x.Name == "Cold Brew").Select(x => x.Id).FirstAsync();

        dataContext.MenuCustomizations.AddRange(
            new MenuCustomization { MenuItemId = latteId, GroupName = "Milk", OptionName = "Whole Milk", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
            new MenuCustomization { MenuItemId = latteId, GroupName = "Milk", OptionName = "Oatmilk", AdditionalPrice = 0.75m, SortOrder = 2 },
            new MenuCustomization { MenuItemId = latteId, GroupName = "Espresso", OptionName = "Extra Shot", AdditionalPrice = 1.25m, SortOrder = 3 },
            new MenuCustomization { MenuItemId = mochaId, GroupName = "Toppings", OptionName = "Whipped Cream", AdditionalPrice = 0, IsDefault = true, SortOrder = 1 },
            new MenuCustomization { MenuItemId = mochaId, GroupName = "Toppings", OptionName = "Caramel Drizzle", AdditionalPrice = 0.50m, SortOrder = 2 },
            new MenuCustomization { MenuItemId = coldBrewId, GroupName = "Sweetener", OptionName = "Vanilla Sweet Cream", AdditionalPrice = 0.75m, SortOrder = 1 },
            new MenuCustomization { MenuItemId = coldBrewId, GroupName = "Sweetener", OptionName = "Sugar Free Vanilla", AdditionalPrice = 0.50m, SortOrder = 2 }
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
                Name = "Double Stars Weekend",
                Description = "Bank bonus stars on your next mobile order",
                PointsCost = 180,
                IsActive = true,
                TierName = "Gold",
                OfferType = "Stars",
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
                Benefits = "1.5x stars, early seasonal access",
                AccentColor = "#7c8a99"
            },
            new RewardTier
            {
                Name = "Gold",
                MinPoints = 300,
                Benefits = "2x stars, premium offers, surprise drops",
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
            .Where(x => x.Name.Contains("Covington"))
            .Select(x => x.Id)
            .FirstAsync();

        var mocha = await dataContext.MenuItems.FirstAsync(x => x.Name == "Mocha");
        var croissant = await dataContext.MenuItems.FirstAsync(x => x.Name == "Croissant");

        var orders = new[]
        {
            new Order
            {
                UserId = sueId,
                LocationId = locationId,
                OrderType = "pickup",
                Status = "Completed",
                Total = 12.25m,
                PaymentStatus = "Paid",
                PickupName = "Sue",
                CreatedAt = DateTime.UtcNow.AddHours(-6),
                StarsEarned = 18,
                Items =
                [
                    new OrderItem
                    {
                        MenuItemId = mocha.Id,
                        ItemName = mocha.Name,
                        Quantity = 1,
                        UnitPrice = mocha.Price,
                        Total = mocha.Price,
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
                Total = 5.25m,
                PaymentStatus = "Paid",
                PickupName = "Sue",
                CreatedAt = DateTime.UtcNow.AddMinutes(-45),
                StarsEarned = 7,
                Items =
                [
                    new OrderItem
                    {
                        MenuItemId = mocha.Id,
                        ItemName = "Brown Sugar Shaker",
                        Quantity = 1,
                        UnitPrice = 5.25m,
                        Total = 5.25m,
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
                Message = "Try the Brown Sugar Shaker and earn bonus stars this week."
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
