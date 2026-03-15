import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../services/api";

type UserRow = { id: number; userName: string; displayName?: string; balance: number };

const PRESETS = [
  { label: "Refund (50 pts)", amount: 50, reason: "Refund compensation" },
  { label: "Apology treat (100 pts)", amount: 100, reason: "Apology - free treat" },
  { label: "Loyalty bonus (200 pts)", amount: 200, reason: "Loyalty bonus" },
  { label: "Custom", amount: 0, reason: "" },
];

export default function AdminPointsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState("Refund compensation");
  const [preset, setPreset] = useState(0);
  const [awarding, setAwarding] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!user.roles.includes("Admin")) { navigate("/"); return; }
    fetch(`${API_BASE_URL}/api/admin/users`, { credentials: "include" })
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handlePreset = (idx: number) => {
    setPreset(idx);
    if (PRESETS[idx].amount > 0) {
      setAmount(PRESETS[idx].amount);
      setReason(PRESETS[idx].reason);
    }
  };

  const handleAward = async () => {
    if (!selectedUserId) { setMsg("Select a user."); return; }
    if (amount <= 0) { setMsg("Amount must be positive."); return; }
    if (!reason.trim()) { setMsg("Enter a reason."); return; }
    setAwarding(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/award-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: selectedUserId, amount, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data);
      setMsg(data.message);
      // Update local balance
      setUsers((prev) => prev.map((u) => u.id === selectedUserId ? { ...u, balance: data.newBalance } : u));
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to award points.");
    } finally {
      setAwarding(false);
    }
  };

  const filtered = users.filter((u) =>
    u.userName.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Award Points</h1>
        <button className="btn-secondary" onClick={() => navigate("/admin")}>Dashboard</button>
      </div>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Give bonus points to customers for refunds, apologies, or special occasions.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
        {/* User selector */}
        <div className="card">
          <h3 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Select Customer</h3>
          <input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", marginBottom: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box" }}
          />
          <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {filtered.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                style={{
                  padding: "0.6rem 0.75rem", borderRadius: 8, cursor: "pointer",
                  background: selectedUserId === u.id ? "var(--espresso)" : "#f8f8f8",
                  color: selectedUserId === u.id ? "#fff" : "var(--text)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{u.displayName ?? u.userName}</span>
                  {u.displayName && <span style={{ opacity: 0.7, fontSize: "0.82rem", marginLeft: "0.4rem" }}>@{u.userName}</span>}
                </div>
                <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{u.balance} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Award form */}
        <div className="card">
          <h3 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Award Points</h3>

          {selectedUser && (
            <div style={{ background: "#fef9f0", border: "1px solid var(--amber)", borderRadius: 8, padding: "0.75rem", marginBottom: "1rem" }}>
              <span style={{ fontWeight: 700 }}>{selectedUser.displayName ?? selectedUser.userName}</span>
              <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>current: {selectedUser.balance} pts</span>
            </div>
          )}

          <div className="form-group">
            <label>Quick Preset</label>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handlePreset(i)}
                  style={{
                    padding: "0.35rem 0.75rem", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.82rem",
                    background: preset === i ? "var(--espresso)" : "var(--border)",
                    color: preset === i ? "#fff" : "var(--text)",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Points to Award</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => { setAmount(parseInt(e.target.value) || 0); setPreset(3); }}
            />
          </div>

          <div className="form-group">
            <label>Reason (shown to customer)</label>
            <input
              value={reason}
              onChange={(e) => { setReason(e.target.value); setPreset(3); }}
              placeholder="e.g. Refund for order issue"
            />
          </div>

          {msg && (
            <p className={msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("select") ? "error-msg" : "success-msg"} style={{ marginBottom: "0.75rem" }}>
              {msg}
            </p>
          )}

          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={handleAward}
            disabled={awarding || !selectedUserId}
          >
            {awarding ? "Awarding..." : `Award ${amount} Points`}
          </button>
        </div>
      </div>
    </div>
  );
}
