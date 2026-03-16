using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Orders;
using Selu383.SP26.Api.Features.Payments;

namespace Selu383.SP26.Api.Services;

public class PaymentService(
    DataContext dataContext,
    PushNotificationService pushNotificationService,
    StarEarningService starEarningService)
{
    public async Task<IReadOnlyList<Payment>> ProcessOrderPaymentAsync(int userId, CheckoutPaymentDto dto)
    {
        var order = await dataContext.Orders
            .SingleOrDefaultAsync(x => x.Id == dto.OrderId && x.UserId == userId);

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

        var payments = new List<Payment>();
        var remainingBalance = amountDue;

        if (!string.IsNullOrWhiteSpace(dto.GiftCardCode))
        {
            var giftCard = await dataContext.GiftCards
                .SingleOrDefaultAsync(x => x.Code == dto.GiftCardCode && x.IsActive);

            if (giftCard == null)
            {
                throw new InvalidOperationException("Gift card not found");
            }

            var giftCardAmount = Math.Min(giftCard.Balance, remainingBalance);
            if (giftCardAmount > 0)
            {
                giftCard.Balance -= giftCardAmount;
                if (giftCard.Balance <= 0)
                {
                    giftCard.IsActive = false;
                }

                payments.Add(new Payment
                {
                    UserId = userId,
                    OrderId = order.Id,
                    GiftCardId = giftCard.Id,
                    Amount = giftCardAmount,
                    Method = "GiftCard",
                    Status = "Approved",
                    ProviderReference = giftCard.Code
                });

                remainingBalance -= giftCardAmount;
            }
        }

        if (remainingBalance > 0)
        {
            payments.Add(new Payment
            {
                UserId = userId,
                OrderId = order.Id,
                Amount = remainingBalance,
                Method = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "Card" : dto.PaymentMethod,
                Status = "Approved",
                ProviderReference = $"PAY-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..20],
                ExternalIntentId = $"pi_{Guid.NewGuid():N}"[..18],
                CardLastFour = dto.CardLastFour
            });
        }

        dataContext.Payments.AddRange(payments);

        order.PaymentStatus = "Paid";
        order.Status = order.Status == Order.DefaultStatus ? "Preparing" : order.Status;

        var user = await dataContext.Users.SingleAsync(x => x.Id == userId);
        var stars = starEarningService.CalculateStars(order.Total, user.Points);
        user.Points += stars;
        order.StarsEarned = stars;

        await dataContext.SaveChangesAsync();

        await pushNotificationService.SendAsync(
            userId,
            "Push",
            "Payment received",
            $"Order #{order.Id} was paid successfully and earned {stars} stars.");

        return payments;
    }

    public async Task<GiftCard> PurchaseGiftCardAsync(int userId, GiftCardPurchaseDto dto)
    {
        var code = $"LION-{Guid.NewGuid():N}"[..16].ToUpperInvariant();

        var giftCard = new GiftCard
        {
            Code = code,
            InitialBalance = dto.Amount,
            Balance = dto.Amount,
            PurchasedByUserId = userId,
            PurchasedAt = DateTime.UtcNow
        };

        dataContext.GiftCards.Add(giftCard);
        await dataContext.SaveChangesAsync();

        dataContext.Payments.Add(new Payment
        {
            UserId = userId,
            GiftCardId = giftCard.Id,
            Amount = dto.Amount,
            Method = "GiftCardPurchase",
            Status = "Approved",
            ProviderReference = code
        });

        await dataContext.SaveChangesAsync();

        await pushNotificationService.SendAsync(
            userId,
            "Email",
            "Gift card ready",
            $"Gift card {code} has been loaded with ${dto.Amount:F2}.");

        return giftCard;
    }

    public async Task<GiftCard> RedeemGiftCardAsync(int userId, GiftCardRedemptionDto dto)
    {
        var giftCard = await dataContext.GiftCards
            .SingleOrDefaultAsync(x => x.Code == dto.Code && x.IsActive);

        if (giftCard == null)
        {
            throw new InvalidOperationException("Gift card not found");
        }

        if (giftCard.Balance < dto.Amount)
        {
            throw new InvalidOperationException("Gift card balance is too low");
        }

        giftCard.Balance -= dto.Amount;
        if (giftCard.Balance <= 0)
        {
            giftCard.IsActive = false;
        }

        dataContext.Payments.Add(new Payment
        {
            UserId = userId,
            GiftCardId = giftCard.Id,
            OrderId = dto.OrderId,
            Amount = dto.Amount,
            Method = "GiftCard",
            Status = "Approved",
            ProviderReference = giftCard.Code
        });

        await dataContext.SaveChangesAsync();
        return giftCard;
    }
}
