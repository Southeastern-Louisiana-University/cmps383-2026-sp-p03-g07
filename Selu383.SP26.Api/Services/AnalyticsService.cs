using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Admin;

namespace Selu383.SP26.Api.Services;

public class AnalyticsService(DataContext dataContext)
{
    public async Task<AdminDashboardDto> BuildDashboardAsync()
    {
        var totalOrders = await dataContext.Orders.CountAsync();
        var totalRevenue = await dataContext.Payments
            .Where(x => x.Status == "Approved")
            .SumAsync(x => (decimal?)x.Amount) ?? 0m;

        var pendingOrders = await dataContext.Orders
            .CountAsync(x => x.Status != "Completed" && x.Status != "Cancelled");

        var activeMenuItems = await dataContext.MenuItems.CountAsync(x => x.IsAvailable);
        var rewardsRedeemed = await dataContext.UserRewards.CountAsync();
        var giftCardBalance = await dataContext.GiftCards
            .Where(x => x.IsActive)
            .SumAsync(x => (decimal?)x.Balance) ?? 0m;

        var topProducts = await dataContext.OrderItems
            .GroupBy(x => x.ItemName)
            .Select(x => new DashboardProductStatDto
            {
                Name = x.Key,
                QuantitySold = x.Sum(y => y.Quantity),
                Revenue = x.Sum(y => y.Total)
            })
            .OrderByDescending(x => x.QuantitySold)
            .ThenByDescending(x => x.Revenue)
            .Take(5)
            .ToListAsync();

        var recentOrders = await dataContext.Orders
            .OrderByDescending(x => x.CreatedAt)
            .Take(6)
            .Select(x => new DashboardOrderSummaryDto
            {
                Id = x.Id,
                Status = x.Status,
                Total = x.Total,
                OrderType = x.OrderType,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        var lowInventory = await dataContext.MenuItems
            .Where(x => x.InventoryCount <= 5)
            .OrderBy(x => x.InventoryCount)
            .ThenBy(x => x.Name)
            .Select(x => new LowInventoryItemDto
            {
                Id = x.Id,
                Name = x.Name,
                InventoryCount = x.InventoryCount,
                Category = x.Category
            })
            .ToListAsync();

        return new AdminDashboardDto
        {
            TotalOrders = totalOrders,
            TotalRevenue = totalRevenue,
            PendingOrders = pendingOrders,
            ActiveMenuItems = activeMenuItems,
            RewardsRedeemed = rewardsRedeemed,
            OutstandingGiftCardBalance = giftCardBalance,
            TopProducts = topProducts,
            RecentOrders = recentOrders,
            LowInventoryItems = lowInventory
        };
    }
}
