namespace Selu383.SP26.Api.Features.Admin;

public class AdminDashboardDto
{
    public int TotalOrders { get; set; }

    public decimal TotalRevenue { get; set; }

    public int PendingOrders { get; set; }

    public int ActiveMenuItems { get; set; }

    public int RewardsRedeemed { get; set; }

    public decimal OutstandingGiftCardBalance { get; set; }

    public List<DashboardProductStatDto> TopProducts { get; set; } = [];

    public List<DashboardOrderSummaryDto> RecentOrders { get; set; } = [];

    public List<LowInventoryItemDto> LowInventoryItems { get; set; } = [];
}
