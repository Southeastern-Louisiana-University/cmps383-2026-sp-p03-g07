using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Orders;
using Selu383.SP26.Api.Features.Payments;

namespace Selu383.SP26.Api.Services;

public class PaymentService(
    DataContext dataContext,
    PushNotificationService pushNotificationService,
    StarEarningService starEarningService)
{
    public async Task<IReadOnlyList<Payment>> ProcessOrderPaymentAsync(int? userId, CheckoutPaymentDto dto)
    {
        var order = await dataContext.Orders
            .SingleOrDefaultAsync(x => x.Id == dto.OrderId && (x.UserId == userId || x.UserId == null));

        if (order == null)
        {
            throw new InvalidOperationException("Order not found");
        }

        var amountDue = dto.Amount ?? order.Total;
        if (amountDue <= 0)
        {
            throw new InvalidOperationException("Payment amount must be greater than zero");
        }

        if (order.PaymentStatus == "Paid")
        {
            throw new InvalidOperationException("Order has already been paid");
        }

        var payments = new List<Payment>
        {
            new()
            {
                UserId = userId,
                OrderId = order.Id,
                Amount = amountDue,
                Method = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "Card" : dto.PaymentMethod,
                Status = "Approved",
                ProviderReference = $"PAY-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..20],
                ExternalIntentId = !string.IsNullOrWhiteSpace(dto.StripeIntentId)
                    ? dto.StripeIntentId
                    : $"pi_{Guid.NewGuid():N}"[..18],
                CardLastFour = dto.CardLastFour
            }
        };

        dataContext.Payments.AddRange(payments);

        order.PaymentStatus = "Paid";
        order.Status = order.Status == Order.DefaultStatus ? "Preparing" : order.Status;

        var stars = 0;
        if (userId != null)
        {
            var user = await dataContext.Users.SingleOrDefaultAsync(x => x.Id == userId);
            if (user != null)
            {
                stars = starEarningService.CalculateStars(order.Total);
                user.Points += stars;
                order.StarsEarned = stars;

                await pushNotificationService.SendAsync(
                    userId.Value,
                    "Push",
                    "Payment received",
                    $"Order #{order.Id} was paid successfully and earned {stars} Lions.");
            }
        }

        await dataContext.SaveChangesAsync();

        return payments;
    }
}
