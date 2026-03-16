using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Selu383.SP26.Tests.Controllers.Authentication;
using Selu383.SP26.Tests.Dtos;
using Selu383.SP26.Tests.Helpers;

namespace Selu383.SP26.Tests.Controllers;

[TestClass]
public class CommerceEndpointSmokeTests
{
    private WebTestContext context = new();

    [TestInitialize]
    public void Init()
    {
        context = new WebTestContext();
    }

    [TestCleanup]
    public void Cleanup()
    {
        context.Dispose();
    }

    [TestMethod]
    public async Task PublicCatalogEndpoints_ReturnExpectedContracts()
    {
        using var webClient = context.GetStandardWebClient();

        var locationsResponse = await webClient.GetAsync("/api/locations");
        locationsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var locations = await locationsResponse.Content.ReadAsJsonAsync<List<LocationDto>>();
        locations.Should().NotBeNullOrEmpty();

        var firstLocation = locations!.First();

        var locationResponse = await webClient.GetAsync($"/api/locations/{firstLocation.Id}");
        locationResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var categoriesResponse = await webClient.GetAsync("/api/menu/categories");
        categoriesResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var categories = await categoriesResponse.Content.ReadAsJsonAsync<List<string>>();
        categories.Should().Contain("Coffee");
        categories.Should().Contain("Sandwiches & Bagels");
        categories.Should().Contain("Salad & Quiches");
        categories.Should().Contain("Sweet and Pops");
        categories.Should().Contain("Vegan");
        categories.Should().Contain("Gifts");

        var menuResponse = await webClient.GetAsync("/api/menu");
        menuResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var allMenuItems = await menuResponse.Content.ReadAsJsonAsync<List<MenuItemDto>>();
        allMenuItems.Should().NotBeNullOrEmpty();

        var firstMenuItem = allMenuItems!.First();

        var menuByIdResponse = await webClient.GetAsync($"/api/menu/{firstMenuItem.Id}");
        menuByIdResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var menuById = await menuByIdResponse.Content.ReadAsJsonAsync<MenuItemDto>();
        menuById.Should().NotBeNull();
        menuById!.Id.Should().Be(firstMenuItem.Id);

        var menuByLocationResponse = await webClient.GetAsync($"/api/menu/location/{firstMenuItem.LocationId}");
        menuByLocationResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var locationMenu = await menuByLocationResponse.Content.ReadAsJsonAsync<List<MenuItemDto>>();
        locationMenu.Should().Contain(item => item.Id == firstMenuItem.Id);

        var rewardsResponse = await webClient.GetAsync("/api/rewards");
        rewardsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var rewards = await rewardsResponse.Content.ReadAsJsonAsync<List<RewardDto>>();
        rewards.Should().NotBeNullOrEmpty();

        var tiersResponse = await webClient.GetAsync("/api/rewards/tiers");
        tiersResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var tiers = await tiersResponse.Content.ReadAsJsonAsync<List<RewardTierDto>>();
        tiers.Should().NotBeNullOrEmpty();
    }

    [TestMethod]
    public async Task MemberCommerceFlow_WorksAcrossAuthOrdersPaymentsReservationsAndNotifications()
    {
        using var webClient = context.GetStandardWebClient();
        var userName = $"shopper{Guid.NewGuid():N}";

        var registeredUser = await webClient.RegisterAsync(userName);
        registeredUser.Should().NotBeNull();

        var meResponse = await webClient.GetAsync("/api/authentication/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var me = await meResponse.Content.ReadAsJsonAsync<UserDto>();
        me.Should().NotBeNull();
        me!.UserName.Should().Be(userName);

        var locationId = context.GetAnyLocationId();
        const decimal orderTotal = 12.34m;

        var createOrderResponse = await webClient.PostAsJsonAsync("/api/orders", new
        {
            locationId,
            orderType = "pickup",
            pickupName = userName,
            total = orderTotal
        });

        createOrderResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdOrder = await createOrderResponse.Content.ReadAsJsonAsync<OrderDto>();
        createdOrder.Should().NotBeNull();
        createdOrder!.PaymentStatus.Should().Be("Pending");

        var orderTrackResponse = await webClient.GetAsync($"/api/orders/{createdOrder.Id}/track");
        orderTrackResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var orderHistoryResponse = await webClient.GetAsync("/api/orders/history");
        orderHistoryResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var orderHistory = await orderHistoryResponse.Content.ReadAsJsonAsync<List<OrderDto>>();
        orderHistory.Should().Contain(order => order.Id == createdOrder.Id);

        var checkoutResponse = await webClient.PostAsJsonAsync("/api/payments/checkout", new
        {
            orderId = createdOrder.Id,
            paymentMethod = "Card",
            amount = orderTotal,
            cardLastFour = "4242"
        });

        checkoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var checkoutPayments = await checkoutResponse.Content.ReadAsJsonAsync<List<PaymentDto>>();
        checkoutPayments.Should().NotBeNullOrEmpty();

        var paymentsResponse = await webClient.GetAsync("/api/payments/mine");
        paymentsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var payments = await paymentsResponse.Content.ReadAsJsonAsync<List<PaymentDto>>();
        payments.Should().Contain(payment => payment.OrderId == createdOrder.Id);

        var balanceResponse = await webClient.GetAsync("/api/rewards/my-points");
        balanceResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var balance = await balanceResponse.Content.ReadAsJsonAsync<PointsBalanceDto>();
        balance.Should().NotBeNull();
        balance!.Points.Should().BeGreaterThan(0);

        var reservationResponse = await webClient.PostAsJsonAsync("/api/reservations", new
        {
            locationId,
            reservationTime = DateTime.UtcNow.AddDays(2),
            partySize = 2
        });

        reservationResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservation = await reservationResponse.Content.ReadAsJsonAsync<ReservationDto>();
        reservation.Should().NotBeNull();

        var reservationByIdResponse = await webClient.GetAsync($"/api/reservations/{reservation!.Id}");
        reservationByIdResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var giftCardPurchaseResponse = await webClient.PostAsJsonAsync("/api/payments/gift-cards/purchase", new
        {
            amount = 25m,
            recipientName = "Gift Recipient",
            recipientEmail = "gift@example.com",
            message = "Enjoy"
        });

        giftCardPurchaseResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var giftCard = await giftCardPurchaseResponse.Content.ReadAsJsonAsync<GiftCardDto>();
        giftCard.Should().NotBeNull();

        var giftCardLookupResponse = await webClient.GetAsync($"/api/payments/gift-cards/{giftCard!.Code}");
        giftCardLookupResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var giftCardRedeemResponse = await webClient.PostAsJsonAsync("/api/payments/gift-cards/redeem", new
        {
            code = giftCard.Code,
            amount = 5m,
            orderId = createdOrder.Id
        });

        giftCardRedeemResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var redeemedGiftCard = await giftCardRedeemResponse.Content.ReadAsJsonAsync<GiftCardDto>();
        redeemedGiftCard.Should().NotBeNull();
        redeemedGiftCard!.Balance.Should().Be(20m);

        var notificationsResponse = await webClient.GetAsync("/api/notifications");
        notificationsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var notifications = await notificationsResponse.Content.ReadAsJsonAsync<List<NotificationDto>>();
        notifications.Should().NotBeNullOrEmpty();

        var markReadResponse = await webClient.PutAsync($"/api/notifications/{notifications![0].Id}/read", null);
        markReadResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var logoutResponse = await webClient.PostAsync("/api/authentication/logout", null);
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var meAfterLogoutResponse = await webClient.GetAsync("/api/authentication/me");
        meAfterLogoutResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [TestMethod]
    public async Task RewardsAdminAndManagerEndpoints_WorkForAuthorizedUsers()
    {
        using var webClient = context.GetStandardWebClient();

        await webClient.AssertLoggedInAsSue();

        var rewardsResponse = await webClient.GetAsync("/api/rewards");
        rewardsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var rewards = await rewardsResponse.Content.ReadAsJsonAsync<List<RewardDto>>();
        rewards.Should().NotBeNullOrEmpty();

        var pointsBeforeResponse = await webClient.GetAsync("/api/rewards/my-points");
        pointsBeforeResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var pointsBefore = await pointsBeforeResponse.Content.ReadAsJsonAsync<PointsBalanceDto>();
        pointsBefore.Should().NotBeNull();

        var redeemableReward = rewards!
            .OrderBy(reward => reward.PointsCost)
            .First(reward => reward.PointsCost <= pointsBefore!.Points);

        var redeemResponse = await webClient.PostAsync($"/api/rewards/redeem/{redeemableReward.Id}", null);
        redeemResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var pointsAfterResponse = await webClient.GetAsync("/api/rewards/my-points");
        var pointsAfter = await pointsAfterResponse.Content.ReadAsJsonAsync<PointsBalanceDto>();
        pointsAfter.Should().NotBeNull();
        pointsAfter!.Points.Should().Be(pointsBefore!.Points - redeemableReward.PointsCost);

        var rewardHistoryResponse = await webClient.GetAsync("/api/rewards/my-history");
        rewardHistoryResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var rewardHistory = await rewardHistoryResponse.Content.ReadAsJsonAsync<List<RewardHistoryDto>>();
        rewardHistory.Should().Contain(entry => entry.RewardName == redeemableReward.Name);

        await webClient.AssertLoggedOut();
        await webClient.AssertLoggedInAsBob();

        var forbiddenAdminResponse = await webClient.GetAsync("/api/admin/dashboard");
        forbiddenAdminResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        await webClient.AssertLoggedOut();
        await webClient.AssertLoggedInAsAdmin();

        var dashboardResponse = await webClient.GetAsync("/api/admin/dashboard");
        dashboardResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var dashboard = await dashboardResponse.Content.ReadAsJsonAsync<AdminDashboardDto>();
        dashboard.Should().NotBeNull();

        var inventoryReportResponse = await webClient.GetAsync("/api/admin/reports/inventory");
        inventoryReportResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var managerUserName = $"manager{Guid.NewGuid():N}";
        var createUserResponse = await webClient.PostAsJsonAsync("/api/users", new
        {
            userName = managerUserName,
            password = AuthenticationHelpers.DefaultUserPassword,
            roles = new[] { "Manager" }
        });

        createUserResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var createdManager = await createUserResponse.Content.ReadAsJsonAsync<UserDto>();
        createdManager.Should().NotBeNull();

        var createLocationResponse = await webClient.PostAsJsonAsync("/api/locations", new
        {
            name = "Manager Test Location",
            address = "101 Test Ave",
            tableCount = 12,
            managerId = createdManager!.Id
        });

        createLocationResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var managedLocation = await createLocationResponse.Content.ReadAsJsonAsync<LocationDto>();
        managedLocation.Should().NotBeNull();

        var sendNotificationResponse = await webClient.PostAsJsonAsync("/api/notifications", new
        {
            userId = createdManager!.Id,
            channel = "Email",
            title = "Admin check",
            message = "Endpoint smoke test"
        });

        sendNotificationResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        await webClient.AssertLoggedOut();
        var managerLogin = await webClient.LoginAsync(managerUserName);
        managerLogin.Should().NotBeNull();

        var updateLocationResponse = await webClient.PutAsJsonAsync($"/api/locations/{managedLocation!.Id}", new
        {
            id = managedLocation.Id,
            name = "Manager Test Location Updated",
            address = "101 Test Ave",
            tableCount = 18,
            managerId = createdManager.Id
        });

        updateLocationResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var managerMenuCreateResponse = await webClient.PostAsJsonAsync("/api/menu", new
        {
            name = "Manager Espresso",
            category = "Drinks",
            description = "Manager-created menu item",
            price = 4.95m,
            isAvailable = true,
            locationId = managedLocation.Id,
            imageUrl = "",
            calories = 120,
            isFeatured = false,
            inventoryCount = 11,
            preparationTag = "House",
            customizations = Array.Empty<object>()
        });

        managerMenuCreateResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var managedMenuItem = await managerMenuCreateResponse.Content.ReadAsJsonAsync<MenuItemDto>();
        managedMenuItem.Should().NotBeNull();

        var managerNotificationsResponse = await webClient.GetAsync("/api/notifications");
        managerNotificationsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var managerNotifications = await managerNotificationsResponse.Content.ReadAsJsonAsync<List<NotificationDto>>();
        managerNotifications.Should().Contain(notification => notification.Title == "Admin check");

        await webClient.AssertLoggedOut();
        await webClient.AssertLoggedInAsAdmin();

        var updateMenuResponse = await webClient.PutAsJsonAsync($"/api/menu/{managedMenuItem!.Id}", new
        {
            id = managedMenuItem.Id,
            name = "Manager Espresso Updated",
            category = "Drinks",
            description = "Updated by admin",
            price = 5.25m,
            isAvailable = true,
            locationId = managedLocation.Id,
            imageUrl = "",
            calories = 130,
            isFeatured = true,
            inventoryCount = 8,
            preparationTag = "Featured",
            customizations = Array.Empty<object>()
        });

        updateMenuResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var deleteMenuResponse = await webClient.DeleteAsync($"/api/menu/{managedMenuItem.Id}");
        deleteMenuResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var deleteLocationResponse = await webClient.DeleteAsync($"/api/locations/{managedLocation.Id}");
        deleteLocationResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private sealed class LocationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? ManagerId { get; set; }
    }

    private sealed class MenuItemDto
    {
        public int Id { get; set; }
        public int LocationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    private sealed class RewardDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int PointsCost { get; set; }
    }

    private sealed class RewardTierDto
    {
        public int Id { get; set; }
    }

    private sealed class OrderDto
    {
        public int Id { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
    }

    private sealed class ReservationDto
    {
        public int Id { get; set; }
    }

    private sealed class PaymentDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
    }

    private sealed class GiftCardDto
    {
        public string Code { get; set; } = string.Empty;
        public decimal Balance { get; set; }
    }

    private sealed class NotificationDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
    }

    private sealed class PointsBalanceDto
    {
        public int Points { get; set; }
    }

    private sealed class RewardHistoryDto
    {
        public string RewardName { get; set; } = string.Empty;
    }

    private sealed class AdminDashboardDto
    {
        public int TotalOrders { get; set; }
    }
}
