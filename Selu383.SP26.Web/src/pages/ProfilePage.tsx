import { useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { notificationsApi } from "../api/notificationsApi";
import { useAuth } from "../store/authStore";
import type { AppNotification } from "../types/notification.types";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

const guestHighlights = [
  {
    title: "Track rewards",
    description: "See your points balance, current tier, and redeemable perks in one place.",
  },
  {
    title: "Save order history",
    description: "Keep past orders, receipts, and favorite pickups connected to your profile.",
  },
  {
    title: "Stay in the loop",
    description: "Get storefront notifications for offers, order progress, and member drops.",
  },
];

function formatNotificationDate(createdAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(createdAt));
}

export default function ProfilePage({ navigate }: PageProps) {
  const { logout, refresh, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setStatusMessage("");
      return;
    }

    let isMounted = true;
    setLoadingNotifications(true);

    void notificationsApi
      .getNotifications()
      .then((nextNotifications) => {
        if (!isMounted) {
          return;
        }

        setNotifications(nextNotifications);
        setStatusMessage("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setStatusMessage(error instanceof Error ? error.message : "Unable to load account notifications.");
      })
      .finally(() => {
        if (isMounted) {
          setLoadingNotifications(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  function openEdit() {
    setDisplayName(user?.displayName ?? "");
    setBirthday(user?.birthday ? user.birthday.slice(0, 10) : "");
    setProfilePictureUrl(user?.profilePictureUrl ?? "");
    setProfileMessage("");
    setEditOpen(true);
  }

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMessage("");
    try {
      await authApi.updateProfile({
        displayName,
        birthday: birthday || null,
        profilePictureUrl,
      });
      await refresh();
      setEditOpen(false);
      setProfileMessage("Profile updated.");
    } catch (e) {
      setProfileMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSavingProfile(false);
    }
  }

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  if (!user) {
    return (
      <div className="commerce-page account-page">
        <header className="commerce-topbar">
          <StorefrontTopRail activeTab="account" navigate={navigate} />
        </header>

        <section className="commerce-canvas">
          <section className="commerce-hero account-guest-hero">
            <div className="commerce-hero-copy">
              <p className="commerce-kicker">Account</p>
              <h1>YOUR LIONS ACCOUNT, ALL IN ONE PLACE.</h1>
              <p className="commerce-hero-description">
                Sign in to see points, rewards, notifications, and your order history in the same
                storefront experience as the rest of the site.
              </p>

              <div className="commerce-hero-pills">
                <span className="commerce-hero-pill">Rewards synced</span>
                <span className="commerce-hero-pill">Orders saved</span>
                <span className="commerce-hero-pill">Member alerts ready</span>
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

            <div className="account-highlight-grid">
              {guestHighlights.map((highlight) => (
                <article className="account-highlight-card" key={highlight.title}>
                  <strong>{highlight.title}</strong>
                  <p>{highlight.description}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    );
  }

  return (
    <div className="commerce-page account-page">
      <header className="commerce-topbar">
        <StorefrontTopRail activeTab="account" navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <section className="commerce-hero account-hero">
          <div className="commerce-hero-copy">
            {user.profilePictureUrl && (
              <img alt="Profile" src={user.profilePictureUrl} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", marginBottom: "0.5rem" }} />
            )}
            <p className="commerce-kicker">Account</p>
            <h1>WELCOME BACK, {(user.displayName || user.userName).toUpperCase()}.</h1>
            <p className="commerce-hero-description">
              Keep your rewards, notifications, and recent storefront activity tied together in one
              place while moving between orders, reservations, and redemptions.
            </p>

            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">{user.points} stars</span>
              <span className="commerce-hero-pill">{user.roles.join(", ")}</span>
              <span className="commerce-hero-pill">{unreadCount} unread alerts</span>
            </div>

            <div className="commerce-hero-actions">
              <button className="commerce-primary-button" onClick={() => navigate("/rewards")} type="button">
                Open rewards
              </button>
              <button className="commerce-secondary-button" onClick={() => navigate("/orders")} type="button">
                Order history
              </button>
              <button className="commerce-secondary-button" onClick={openEdit} type="button">
                Edit profile
              </button>
              <button className="commerce-secondary-button" onClick={() => void logout()} type="button">
                Log out
              </button>
            </div>

            {profileMessage ? <p className="commerce-inline-status">{profileMessage}</p> : null}
            {statusMessage ? <p className="commerce-inline-status commerce-inline-status-error">{statusMessage}</p> : null}

            {editOpen && (
              <div style={{ marginTop: "1.5rem", display: "grid", gap: "0.75rem", maxWidth: 420 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.9rem" }}>
                  <span>Display name</span>
                  <input className="commerce-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.9rem" }}>
                  <span>Birthday (get a free item on your birthday!)</span>
                  <input className="commerce-input" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.9rem" }}>
                  <span>Profile picture URL</span>
                  <input className="commerce-input" placeholder="https://..." value={profilePictureUrl} onChange={(e) => setProfilePictureUrl(e.target.value)} />
                </label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button className="commerce-primary-button" disabled={savingProfile} onClick={() => void saveProfile()} type="button">
                    {savingProfile ? "Saving..." : "Save"}
                  </button>
                  <button className="commerce-secondary-button" onClick={() => setEditOpen(false)} type="button">Cancel</button>
                </div>
              </div>
            )}
          </div>

          <aside className="commerce-summary-card account-summary-card">
            <p className="commerce-panel-kicker">Profile snapshot</p>
            <h2>Member overview</h2>

            <div className="commerce-summary-row">
              <span>Member ID</span>
              <strong>#{user.id}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Roles</span>
              <strong>{user.roles.join(", ")}</strong>
            </div>
            <div className="commerce-summary-row">
              <span>Unread alerts</span>
              <strong>{unreadCount}</strong>
            </div>

            <button
              className="commerce-primary-button commerce-primary-button-block"
              onClick={() => navigate("/gift-cards")}
              type="button"
            >
              Gift cards
            </button>
          </aside>
        </section>

        <section className="account-content-grid">
          <section className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Account essentials</p>
                <h2>Dashboard</h2>
              </div>
            </div>

            <div className="account-stat-grid">
              <article className="account-stat-card">
                <span>Stars balance</span>
                <strong>{user.points}</strong>
                <p>Use your account tab as the quickest route back into rewards and redemptions.</p>
              </article>
              <article className="account-stat-card">
                <span>Roles</span>
                <strong>{user.roles.join(", ")}</strong>
                <p>Permissions follow this list across admin, storefront, and checkout experiences.</p>
              </article>
              <article className="account-stat-card">
                <span>Notifications</span>
                <strong>{loadingNotifications ? "Refreshing" : notifications.length}</strong>
                <p>{loadingNotifications ? "Pulling your latest account alerts now." : "Messages from orders, rewards, and storefront drops."}</p>
              </article>
            </div>
          </section>

          <section className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Inbox</p>
                <h2>Notifications</h2>
              </div>
              <span>{notifications.length} total</span>
            </div>

            {notifications.length === 0 ? (
              <div className="commerce-empty-state">
                <h3>No notifications yet.</h3>
                <p>Order updates, reward confirmations, and account messages will appear here.</p>
              </div>
            ) : (
              <div className="account-notification-list">
                {notifications.map((notification) => (
                  <article className="account-notification-card" key={notification.id}>
                    <div className="account-notification-meta">
                      <span>{notification.channel}</span>
                      <span>{formatNotificationDate(notification.createdAt)}</span>
                    </div>
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </div>
  );
}
