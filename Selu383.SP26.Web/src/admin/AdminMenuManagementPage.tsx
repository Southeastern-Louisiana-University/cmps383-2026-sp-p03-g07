import { useEffect, useState } from "react";
import { menuApi } from "../api/menuApi";
import type { MenuItem } from "../types/menu.types";

const emptyItem: Partial<MenuItem> = {
  name: "",
  category: "",
  description: "",
  price: 0,
  isAvailable: true,
  locationId: 1,
  imageUrl: "",
  calories: 0,
  isFeatured: false,
  inventoryCount: 10,
  preparationTag: "",
  customizations: [],
};

export default function AdminMenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<Partial<MenuItem>>(emptyItem);
  const [saving, setSaving] = useState(false);

  function loadMenu() {
    void menuApi
      .getMenu()
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    loadMenu();
  }, []);

  function startEdit(item: MenuItem) {
    setEditing(item);
    setForm({ ...item });
  }

  function startCreate() {
    setEditing(null);
    setForm({ ...emptyItem });
  }

  async function save() {
    setSaving(true);
    try {
      const body = JSON.stringify({ ...form, customizations: form.customizations ?? [] });
      const url = editing ? `/api/menu/${editing.id}` : "/api/menu";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      loadMenu();
      setForm(emptyItem);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: number) {
    if (!window.confirm("Delete this item?")) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const isEditing = editing !== null || form.name !== "";

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <section className="section-card">
        <div className="section-heading">
          <h2>{editing ? `Edit: ${editing.name}` : "Add menu item"}</h2>
          {editing && (
            <button className="secondary-button" onClick={() => { setEditing(null); setForm(emptyItem); }} type="button">
              Cancel
            </button>
          )}
        </div>

        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {(["name", "category", "description", "imageUrl", "preparationTag"] as const).map((field) => (
            <label key={field} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem" }}>
              <span style={{ opacity: 0.7, textTransform: "capitalize" }}>{field}</span>
              <input
                className="commerce-input"
                value={(form[field] as string) ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              />
            </label>
          ))}
          {(["price", "calories", "inventoryCount", "locationId"] as const).map((field) => (
            <label key={field} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem" }}>
              <span style={{ opacity: 0.7, textTransform: "capitalize" }}>{field}</span>
              <input
                className="commerce-input"
                type="number"
                value={(form[field] as number) ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
              />
            </label>
          ))}
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>
            <input
              type="checkbox"
              checked={form.isAvailable ?? true}
              onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
            />
            Available
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>
            <input
              type="checkbox"
              checked={form.isFeatured ?? false}
              onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
            />
            Featured
          </label>
        </div>

        {error && <p style={{ color: "var(--error, red)", marginTop: "0.5rem" }}>{error}</p>}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button className="primary-button" disabled={saving || !form.name} onClick={() => void save()} type="button">
            {saving ? "Saving..." : editing ? "Save changes" : "Create item"}
          </button>
          {isEditing && !editing && (
            <button className="secondary-button" onClick={() => setForm(emptyItem)} type="button">Clear</button>
          )}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>Menu items ({items.length})</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="secondary-button" onClick={loadMenu} type="button">Refresh</button>
            <button className="primary-button" onClick={startCreate} type="button">+ Add item</button>
          </div>
        </div>

        <div className="stack-list">
          {items.map((item) => (
            <article className="line-item" key={item.id}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.category} - {item.isAvailable ? "Available" : "Unavailable"} - {item.inventoryCount} in stock</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <strong>${item.price.toFixed(2)}</strong>
                <button className="secondary-button" onClick={() => startEdit(item)} type="button">Edit</button>
                <button className="secondary-button" onClick={() => void deleteItem(item.id)} style={{ color: "var(--error, red)" }} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
