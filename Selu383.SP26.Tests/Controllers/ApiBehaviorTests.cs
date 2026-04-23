using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Menu;
using Selu383.SP26.Tests.Controllers.Authentication;
using Selu383.SP26.Tests.Helpers;

namespace Selu383.SP26.Tests.Controllers;

[TestClass]
public class ApiBehaviorTests
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
    public async Task LocationsGet_ReturnsJsonInDevelopment()
    {
        using var webClient = context.GetStandardWebClient();

        var response = await webClient.GetAsync("/api/locations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var body = await response.Content.ReadAsStringAsync();
        body.Should().NotContain("<!doctype html>", "API routes should not be swallowed by the SPA proxy");

        var locations = await response.Content.ReadAsJsonAsync<List<LocationDto>>();
        locations.Should().NotBeNull();
        locations.Should().NotBeEmpty();
    }

    [TestMethod]
    public async Task Register_RequiresEmailAndPhone()
    {
        using var webClient = context.GetStandardWebClient();

        var response = await webClient.PostAsJsonAsync("/api/authentication/register", new
        {
            userName = $"registermissing{Guid.NewGuid():N}",
            password = AuthenticationHelpers.DefaultUserPassword
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [TestMethod]
    public async Task PasswordReset_WorksWithEmailAndPhone()
    {
        using var webClient = context.GetStandardWebClient();

        var userName = $"reset{Guid.NewGuid():N}";
        var email = $"{userName}@example.com";
        const string phone = "9855550100";
        const string newPassword = "NewPassword123!";

        var registerResponse = await webClient.PostAsJsonAsync("/api/authentication/register", new
        {
            userName,
            password = AuthenticationHelpers.DefaultUserPassword,
            email,
            phone
        });

        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var logoutResponse = await webClient.PostAsync("/api/authentication/logout", null);
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var resetResponse = await webClient.PostAsJsonAsync("/api/authentication/reset-password", new
        {
            userName,
            email,
            phone,
            newPassword
        });

        resetResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginResponse = await webClient.PostAsJsonAsync("/api/authentication/login", new
        {
            userName,
            password = newPassword
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [TestMethod]
    public async Task MenuCreate_RequiresAuthorizedLocationManagerOrAdmin()
    {
        using var webClient = context.GetStandardWebClient();
        var locationId = context.GetAnyLocationId();

        var anonymousResponse = await webClient.PostAsJsonAsync("/api/menu", new
        {
            name = "Test Drink",
            category = "Coffee",
            price = 5.25m,
            isAvailable = true,
            locationId
        });

        anonymousResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        await webClient.AssertLoggedInAsBob();

        var userResponse = await webClient.PostAsJsonAsync("/api/menu", new
        {
            name = "Test Drink",
            category = "Coffee",
            price = 5.25m,
            isAvailable = true,
            locationId
        });

        userResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        await webClient.AssertLoggedOut();
        await webClient.AssertLoggedInAsAdmin();

        var invalidLocationResponse = await webClient.PostAsJsonAsync("/api/menu", new
        {
            name = "Ghost Drink",
            category = "Coffee",
            price = 5.25m,
            isAvailable = true,
            locationId = 99999
        });

        invalidLocationResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var invalidCategoryResponse = await webClient.PostAsJsonAsync("/api/menu", new
        {
            name = "Ghost Drink",
            category = "Drinks",
            price = 5.25m,
            isAvailable = true,
            locationId
        });

        invalidCategoryResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var adminResponse = await webClient.PostAsJsonAsync("/api/menu", new
        {
            name = "Manager Approved Latte",
            category = "Coffee",
            price = 5.25m,
            isAvailable = true,
            locationId
        });

        adminResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdItem = await adminResponse.Content.ReadAsJsonAsync<MenuItemDto>();
        createdItem.Should().NotBeNull();
        createdItem!.LocationId.Should().Be(locationId);
    }

    [TestMethod]
    public async Task MenuGet_HidesUnsupportedCategoriesFromThePublicCatalog()
    {
        var locationId = context.GetAnyLocationId();
        var legacyItemId = 0;

        using (var scope = context.GetServices().CreateScope())
        {
            var dataContext = scope.ServiceProvider.GetRequiredService<DataContext>();
            var legacyItem = new MenuItem
            {
                Name = "Legacy Drink",
                Category = "Drinks",
                Description = "Legacy category item",
                Price = 4.50m,
                IsAvailable = true,
                LocationId = locationId,
                ImageUrl = "",
                Calories = 90,
                InventoryCount = 5,
                PreparationTag = "Legacy"
            };
            dataContext.MenuItems.Add(legacyItem);
            await dataContext.SaveChangesAsync();
            legacyItemId = legacyItem.Id;
        }

        using var webClient = context.GetStandardWebClient();

        var publicResponse = await webClient.GetAsync("/api/menu");
        publicResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var publicItems = await publicResponse.Content.ReadAsJsonAsync<List<MenuItemDto>>();
        publicItems.Should().NotContain(item => item.Name == "Legacy Drink");

        var publicDetailResponse = await webClient.GetAsync($"/api/menu/{legacyItemId}");
        publicDetailResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        await webClient.AssertLoggedInAsAdmin();

        var managementResponse = await webClient.GetAsync("/api/menu?includeUnsupported=true");
        managementResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var managementItems = await managementResponse.Content.ReadAsJsonAsync<List<MenuItemDto>>();
        managementItems.Should().Contain(item => item.Name == "Legacy Drink");

        var managementDetailResponse = await webClient.GetAsync($"/api/menu/{legacyItemId}?includeUnsupported=true");
        managementDetailResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [TestMethod]
    public async Task Orders_AreScopedToCurrentUser_AndUseTheAuthenticatedUserId()
    {
        using var webClient = context.GetStandardWebClient();
        var bobId = context.GetBobUserId();
        var locationId = context.GetAnyLocationId();

        await webClient.AssertLoggedInAsBob();

        var createResponse = await webClient.PostAsJsonAsync("/api/orders", new
        {
            userId = -1,
            locationId,
            orderType = "pickup",
            status = "completed",
            total = 12.34m
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdOrder = await createResponse.Content.ReadAsJsonAsync<OrderDto>();
        createdOrder.Should().NotBeNull();
        createdOrder!.UserId.Should().Be(bobId);
        createdOrder.Status.Should().Be("Received");

        var bobOrdersResponse = await webClient.GetAsync("/api/orders");
        bobOrdersResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var bobOrders = await bobOrdersResponse.Content.ReadAsJsonAsync<List<OrderDto>>();
        bobOrders.Should().HaveCount(1);
        bobOrders![0].Id.Should().Be(createdOrder.Id);

        await webClient.AssertLoggedOut();
        var isolatedUser = await webClient.RegisterAsync($"orderscope{Guid.NewGuid():N}");
        isolatedUser.Should().NotBeNull();

        var isolatedOrdersResponse = await webClient.GetAsync("/api/orders");
        isolatedOrdersResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var isolatedOrders = await isolatedOrdersResponse.Content.ReadAsJsonAsync<List<OrderDto>>();
        isolatedOrders.Should().BeEmpty();

        var forbiddenGetResponse = await webClient.GetAsync($"/api/orders/{createdOrder.Id}");
        forbiddenGetResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [TestMethod]
    public async Task OrderStatusUpdate_RequiresAdminOrLocationManager()
    {
        using var webClient = context.GetStandardWebClient();
        var locationId = context.GetAnyLocationId();

        await webClient.AssertLoggedInAsBob();

        var createResponse = await webClient.PostAsJsonAsync("/api/orders", new
        {
            locationId,
            orderType = "pickup",
            total = 8.50m
        });

        var createdOrder = await createResponse.Content.ReadAsJsonAsync<OrderDto>();
        createdOrder.Should().NotBeNull();

        var userUpdateResponse = await webClient.PutAsJsonAsync($"/api/orders/{createdOrder!.Id}/status", "completed");
        userUpdateResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        await webClient.AssertLoggedOut();
        await webClient.AssertLoggedInAsAdmin();

        var adminUpdateResponse = await webClient.PutAsJsonAsync($"/api/orders/{createdOrder.Id}/status", "completed");
        adminUpdateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [TestMethod]
    public async Task Reservations_AreScopedToCurrentUser_AndUseTheAuthenticatedUserId()
    {
        using var webClient = context.GetStandardWebClient();
        var bobId = context.GetBobUserId();
        var locationId = context.GetAnyLocationId();

        await webClient.AssertLoggedInAsBob();

        var createResponse = await webClient.PostAsJsonAsync("/api/reservations", new
        {
            userId = -1,
            locationId,
            reservationTime = DateTime.UtcNow.AddDays(1),
            partySize = 3,
            status = "booked"
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdReservation = await createResponse.Content.ReadAsJsonAsync<ReservationDto>();
        createdReservation.Should().NotBeNull();
        createdReservation!.UserId.Should().Be(bobId);
        createdReservation.Status.Should().Be("Confirmed");

        var bobReservationsResponse = await webClient.GetAsync("/api/reservations");
        bobReservationsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var bobReservations = await bobReservationsResponse.Content.ReadAsJsonAsync<List<ReservationDto>>();
        bobReservations.Should().HaveCount(1);
        bobReservations![0].Id.Should().Be(createdReservation.Id);

        await webClient.AssertLoggedOut();
        var isolatedUser = await webClient.RegisterAsync($"reservationscope{Guid.NewGuid():N}");
        isolatedUser.Should().NotBeNull();

        var isolatedReservationsResponse = await webClient.GetAsync("/api/reservations");
        isolatedReservationsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var isolatedReservations = await isolatedReservationsResponse.Content.ReadAsJsonAsync<List<ReservationDto>>();
        isolatedReservations.Should().BeEmpty();

        var forbiddenGetResponse = await webClient.GetAsync($"/api/reservations/{createdReservation.Id}");
        forbiddenGetResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [TestMethod]
    public async Task RewardsMyPoints_ReturnsTheDocumentedContract()
    {
        using var webClient = context.GetStandardWebClient();

        await webClient.AssertLoggedInAsBob();

        var response = await webClient.GetAsync("/api/rewards/my-points");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadAsJsonAsync<PointsBalanceDto>();
        result.Should().NotBeNull();
        result!.Points.Should().Be(0);
    }

    private sealed class LocationDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Address { get; set; }
        public int TableCount { get; set; }
    }

    private sealed class MenuItemDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public int LocationId { get; set; }
    }

    private sealed class OrderDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Status { get; set; }
    }

    private sealed class ReservationDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Status { get; set; }
    }

    private sealed class PointsBalanceDto
    {
        public int Points { get; set; }
    }
}
