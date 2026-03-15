import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { getOrders } from "../services/orderService";
import type { Order } from "../services/orderService";
import { API_BASE_URL } from "../services/api";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reorderMsg, setReorderMsg] = useState("");

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [birthday, setBirthday] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Birthday reward
  const [birthdayMsg, setBirthdayMsg] = useState("");
  const [claimingBirthday, setClaimingBirthday] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setDisplayName(user.displayName ?? "");
    setProfilePictureUrl(user.profilePictureUrl ?? "");
    setBirthday(user.birthday ? user.birthday.split("T")[0] : "");
    getOrders()
      .then((ords) => setOrders([...ords].reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/authentication/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: displayName || null,
          profilePictureUrl: profilePictureUrl || null,
          birthday: birthday || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save.");
      setSaveMsg("Profile saved!");
      setEditing(false);
      // Refresh user data by reloading the page context
      setTimeout(() => window.location.reload(), 500);
    } catch {
      setSaveMsg("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleClaimBirthday = async () => {
    setClaimingBirthday(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/authentication/birthday-reward`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data);
      setBirthdayMsg(data.message ?? "Birthday reward claimed!");
    } catch (e: unknown) {
      setBirthdayMsg(e instanceof Error ? e.message : "Could not claim reward.");
    } finally {
      setClaimingBirthday(false);
    }
  };

  const handleReorder = (order: Order) => {
    if (order.items?.length > 0) {
      order.items.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          addItem({ id: item.menuItemId, name: item.name, price: item.price, locationId: order.locationId });
        }
      });
      setReorderMsg(`Added ${order.items.length} item(s) from Order #${order.id} to cart!`);
      setTimeout(() => setReorderMsg(""), 3000);
    } else {
      navigate("/menu");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const avatarLetter = (user?.displayName ?? user?.userName ?? "?")[0].toUpperCase();

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      {/* Birthday banner */}
      {user?.isBirthday && (
        <div style={{ background: "linear-gradient(135deg, #f39c12, #e74c3c)", color: "#fff", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎂</div>
          <h2 style={{ margin: "0 0 0.5rem", color: "#fff" }}>Happy Birthday, {user.displayName ?? user.userName}!</h2>
          <p style={{ margin: "0 0 1rem", opacity: 0.9 }}>Claim your free 100 birthday points!</p>
          {birthdayMsg ? (
            <p style={{ fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "0.5rem 1rem", borderRadius: 8 }}>{birthdayMsg}</p>
          ) : (
            <button
              style={{ background: "#fff", color: "#e74c3c", border: "none", borderRadius: 25, padding: "0.6rem 1.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}
              onClick={handleClaimBirthday}
              disabled={claimingBirthday}
            >
              {claimingBirthday ? "Claiming..." : "Claim 100 Points"}
            </button>
          )}
        </div>
      )}

      {/* Profile header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          {user?.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt="Profile"
              style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--espresso)" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--espresso)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700 }}>
              {avatarLetter}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 0.25rem", color: "var(--espresso)", fontSize: "1.5rem" }}>
            {user?.displayName ?? user?.userName}
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>@{user?.userName}</p>
          {user?.birthday && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
              Birthday: {new Date(user.birthday).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {user?.roles.includes("Admin") && (
            <button className="btn-secondary" onClick={() => navigate("/admin")}>Admin</button>
          )}
          <button className="btn-secondary" onClick={() => navigate("/rewards")}>Rewards</button>
          <button className="btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel Edit" : "Edit Profile"}
          </button>
          <button className="btn-secondary" style={{ color: "#e74c3c", borderColor: "#e74c3c" }} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card" style={{ marginBottom: "2rem", borderTop: "3px solid var(--espresso)" }}>
          <h3 style={{ color: "var(--espresso)", marginBottom: "1.25rem" }}>Edit Profile</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name (shown publicly)"
              />
            </div>
            <div className="form-group">
              <label>Birthday</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Get 100 free points on your birthday every year!</small>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Profile Picture URL</label>
              <input
                value={profilePictureUrl}
                onChange={(e) => setProfilePictureUrl(e.target.value)}
                placeholder="https://... (paste a photo URL)"
              />
            </div>
          </div>
          {saveMsg && <p className={saveMsg.includes("Failed") ? "error-msg" : "success-msg"} style={{ marginTop: "0.75rem" }}>{saveMsg}</p>}
          <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* Order history */}
      <h2 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Order History</h2>
      {reorderMsg && <p className="success-msg" style={{ marginBottom: "1rem" }}>{reorderMsg}</p>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: "1rem" }}>No orders yet.</p>
          <button className="btn-primary" onClick={() => navigate("/menu")}>Browse Menu</button>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <span style={{ fontWeight: 700, color: "var(--espresso)" }}>Order #{order.id}</span>
                <span style={{ marginLeft: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {order.orderType} &bull; ${order.total.toFixed(2)}
                  {order.discountAmount > 0 && (
                    <span style={{ color: "#27ae60", marginLeft: "0.5rem" }}>(saved ${order.discountAmount.toFixed(2)})</span>
                  )}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span
                  className={`order-status ${order.status.toLowerCase()}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/order-status/${order.id}`)}
                  title="Click to track"
                >
                  {order.status}
                </span>
                {order.items?.length > 0 && (
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.85rem" }} onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                    {expanded === order.id ? "Hide" : "Details"}
                  </button>
                )}
                <button className="btn-secondary" style={{ fontSize: "0.85rem", padding: "0.35rem 0.85rem" }} onClick={() => handleReorder(order)}>
                  Reorder
                </button>
              </div>
            </div>
            {expanded === order.id && order.items && (
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.3rem" }}>
                    <span>{item.name} x{item.quantity}</span>
                    <span style={{ color: "var(--text-muted)" }}>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
