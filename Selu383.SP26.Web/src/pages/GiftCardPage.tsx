import { useState } from "react";
import { paymentsApi } from "../api/paymentsApi";
import { useAuth } from "../store/authStore";
import type { GiftCard } from "../types/payment.types";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

export default function GiftCardPage({ navigate }: PageProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState(25);
  const [recipientName, setRecipientName] = useState("Coffee Lover");
  const [recipientEmail, setRecipientEmail] = useState("guest@example.com");
  const [message, setMessage] = useState("Enjoy your next cafe stop.");
  const [code, setCode] = useState("");
  const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  async function purchaseGiftCard() {
    try {
      const nextGiftCard = await paymentsApi.purchaseGiftCard(
        amount,
        recipientName,
        recipientEmail,
        message,
      );
      setGiftCard(nextGiftCard);
      setStatusMessage(`Gift card ${nextGiftCard.code} created.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to buy gift card.");
    }
  }

  async function lookupGiftCard() {
    try {
      const nextGiftCard = await paymentsApi.getGiftCard(code);
      setGiftCard(nextGiftCard);
      setStatusMessage("Gift card loaded.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Gift card not found.");
    }
  }

  if (!user) {
    return (
      <div className="commerce-page gift-card-page">
        <header className="commerce-topbar">
          <StorefrontTopRail activeTab="account" navigate={navigate} />
        </header>

        <section className="commerce-canvas">
          <section className="commerce-hero gift-card-guest-hero">
            <div className="commerce-hero-copy">
              <p className="commerce-kicker">Gift cards</p>
              <h1>SHARE A LIONS STOP WITH SOMEONE ELSE.</h1>
              <p className="commerce-hero-description">
                Sign in to purchase, check balances, and keep gift cards tied to your account history
                alongside rewards and orders.
              </p>

              <div className="commerce-hero-pills">
                <span className="commerce-hero-pill">$5-$500 value</span>
                <span className="commerce-hero-pill">Balance lookup</span>
                <span className="commerce-hero-pill">Stored to account</span>
              </div>

              <div className="commerce-hero-actions">
                <button className="commerce-primary-button" onClick={() => navigate("/login")} type="button">
                  Sign in
                </button>
                <button
                  className="commerce-secondary-button"
                  onClick={() => navigate("/login?mode=register")}
                  type="button"
                >
                  Register
                </button>
              </div>
            </div>

            <div className="gift-card-feature-grid">
              <article className="gift-card-feature-card">
                <strong>Send a balance</strong>
                <p>Load a gift card for birthdays, study sessions, team treats, or coffee runs.</p>
              </article>
              <article className="gift-card-feature-card">
                <strong>Check remaining funds</strong>
                <p>Look up active balances before using a card during checkout or redemption.</p>
              </article>
              <article className="gift-card-feature-card">
                <strong>Keep it on-brand</strong>
                <p>Gift cards now live inside the same storefront flow as orders, rewards, and account details.</p>
              </article>
            </div>
          </section>
        </section>
      </div>
    );
  }

  return (
    <div className="commerce-page gift-card-page">
      <header className="commerce-topbar">
        <StorefrontTopRail activeTab="account" navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <section className="commerce-hero gift-card-hero">
          <div className="commerce-hero-copy">
            <p className="commerce-kicker">Gift cards</p>
            <h1>LOAD, SEND, AND CHECK EVERY BALANCE.</h1>
            <p className="commerce-hero-description">
              Keep gift cards in the same storefront system as orders and rewards, whether you are buying
              one for someone else or checking a saved card before checkout.
            </p>

            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">${amount.toFixed(0)} selected</span>
              <span className="commerce-hero-pill">{giftCard ? giftCard.code : "No card loaded yet"}</span>
              <span className="commerce-hero-pill">{giftCard?.isActive ? "Active card" : "Ready to create"}</span>
            </div>

            {statusMessage ? <p className="commerce-inline-status">{statusMessage}</p> : null}
          </div>

          <aside className="commerce-summary-card gift-card-summary-card">
            <p className="commerce-panel-kicker">Current card</p>
            <h2>Gift card details</h2>

            <div className="commerce-summary-row">
              <span>Code</span>
              <strong>{giftCard?.code ?? "Not generated yet"}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Balance</span>
              <strong>{giftCard ? `$${giftCard.balance.toFixed(2)}` : "--"}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Status</span>
              <strong>{giftCard ? (giftCard.isActive ? "Active" : "Used up") : "Waiting"}</strong>
            </div>
          </aside>
        </section>

        <section className="gift-card-content-grid">
          <section className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Purchase</p>
                <h2>Buy gift card</h2>
              </div>
            </div>

            <div className="gift-card-form-grid">
              <label className="commerce-field">
                <span>Load amount</span>
                <input
                  className="commerce-input"
                  min={5}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </label>

              <label className="commerce-field">
                <span>Recipient name</span>
                <input
                  className="commerce-input"
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                />
              </label>

              <label className="commerce-field">
                <span>Recipient email</span>
                <input
                  className="commerce-input"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                />
              </label>

              <label className="commerce-field commerce-field-full">
                <span>Message</span>
                <textarea
                  className="commerce-textarea"
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>
            </div>

            <button className="commerce-primary-button" onClick={purchaseGiftCard} type="button">
              Buy gift card
            </button>
          </section>

          <section className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Lookup</p>
                <h2>Check balance</h2>
              </div>
            </div>

            <div className="gift-card-lookup-row">
              <label className="commerce-field gift-card-lookup-field">
                <span>Existing code</span>
                <input
                  className="commerce-input"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </label>
              <button className="commerce-secondary-button" onClick={lookupGiftCard} type="button">
                Check balance
              </button>
            </div>
          </section>
        </section>
      </section>
    </div>
  );
}
