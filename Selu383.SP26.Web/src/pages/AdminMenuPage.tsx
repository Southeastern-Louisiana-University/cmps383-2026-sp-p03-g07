import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../services/api";
import type { MenuItem as MenuItemDto } from "../services/menuService";

const CATEGORIES = ["Drinks", "Food", "Pastries"];

const EMPTY: Omit<MenuItemDto, "id"> = {
  name: "",
  description: "",
  category: "Drinks",
  price: 0,
  isAvailable: true,
  locationId: 1,
};

export default function AdminMenuPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MenuItemDto | null>(null);
  const [form, setForm] = useState<Omit<MenuItemDto, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!user.roles.includes("Admin")) { navigate("/"); return; }
    loadItems();
  }, [user]);

  const loadItems = () => {
    fetch(`${API_BASE_URL}/api/menu`, { credentials: "include" })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const startEdit = (item: MenuItemDto) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description, category: item.category, price: item.price, isAvailable: item.isAvailable, locationId: item.locationId });
    setError("");
  };

  const startNew = () => {
    setEditing({ id: 0, ...EMPTY });
    setForm(EMPTY);
    setError("");
  };

  const cancelEdit = () => { setEditing(null); setError(""); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const isNew = editing!.id === 0;
      const url = isNew ? `${API_BASE_URL}/api/menu` : `${API_BASE_URL}/api/menu/${editing!.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, id: editing!.id }),
      });
      if (!res.ok) throw new Error("Save failed.");
      await loadItems();
      setEditing(null);
    } catch {
      setError("Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailable = async (item: MenuItemDto) => {
    try {
      await fetch(`${API_BASE_URL}/api/menu/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...item, isAvailable: !item.isAvailable }),
      });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/menu/${id}`, { method: "DELETE", credentials: "include" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { /* ignore */ }
  };

  const displayed = filterCat === "All" ? items : items.filter((i) => i.category === filterCat);

  if (loading) return <div className="loading">Loading menu...</div>;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Menu Management</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-secondary" onClick={() => navigate("/admin")}>Dashboard</button>
          <button className="btn-primary" onClick={startNew}>+ Add Item</button>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: "0.35rem 1rem", borderRadius: 6, border: "none", cursor: "pointer",
            background: filterCat === c ? "var(--espresso)" : "var(--border)",
            color: filterCat === c ? "#fff" : "var(--text)", fontWeight: filterCat === c ? 700 : 400,
          }}>{c}</button>
        ))}
      </div>

      {/* Edit / Add form */}
      {editing && (
        <div className="card" style={{ marginBottom: "1.5rem", borderTop: "3px solid var(--espresso)" }}>
          <h3 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>
            {editing.id === 0 ? "Add New Item" : `Edit: ${editing.name}`}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Price ($)</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "1.5rem" }}>
              <input type="checkbox" id="avail" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} />
              <label htmlFor="avail" style={{ margin: 0 }}>Available</label>
            </div>
          </div>
          {error && <p className="error-msg" style={{ marginTop: "0.75rem" }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      )}

      {/* Item list */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {displayed.map((item) => (
          <div key={item.id} className="card" style={{ opacity: item.isAvailable ? 1 : 0.6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--espresso)" }}>{item.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--amber)", marginBottom: "0.25rem" }}>{item.category}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{item.description}</div>
                <div style={{ fontWeight: 700 }}>${item.price.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
              <button className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.7rem" }} onClick={() => startEdit(item)}>
                Edit
              </button>
              <button
                style={{ fontSize: "0.8rem", padding: "0.3rem 0.7rem", borderRadius: 6, border: "none", cursor: "pointer",
                  background: item.isAvailable ? "#e8f5e9" : "#fff3e0",
                  color: item.isAvailable ? "#27ae60" : "#f39c12" }}
                onClick={() => handleToggleAvailable(item)}
              >
                {item.isAvailable ? "Mark Unavailable" : "Mark Available"}
              </button>
              <button
                style={{ fontSize: "0.8rem", padding: "0.3rem 0.7rem", borderRadius: 6, border: "none", cursor: "pointer", background: "#fdecea", color: "#e74c3c" }}
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
