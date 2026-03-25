import { useEffect, useState } from "react";
import { locationsApi } from "../api/locationsApi";
import type { Location, LocationInput } from "../types/location.types";

const emptyLocation: LocationInput = {
  name: "",
  address: "",
  tableCount: 10,
  managerId: null,
};

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationInput>(emptyLocation);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function loadLocations() {
    setErrorMessage("");
    void locationsApi
      .getLocations()
      .then((nextLocations) => {
        setLocations(nextLocations);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  }

  useEffect(() => {
    loadLocations();
  }, []);

  function resetForm() {
    setEditing(null);
    setForm(emptyLocation);
  }

  function startEdit(location: Location) {
    setEditing(location);
    setForm({
      name: location.name,
      address: location.address,
      tableCount: location.tableCount,
      managerId: location.managerId ?? null,
    });
    setStatusMessage("");
    setErrorMessage("");
  }

  async function saveLocation() {
    setSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const payload: LocationInput = {
        name: form.name.trim(),
        address: form.address.trim(),
        tableCount: Number(form.tableCount),
        managerId: form.managerId ? Number(form.managerId) : null,
      };

      if (editing) {
        await locationsApi.updateLocation(editing.id, payload);
        setStatusMessage(`Updated ${payload.name}.`);
      } else {
        await locationsApi.createLocation(payload);
        setStatusMessage(`Created ${payload.name}.`);
      }

      resetForm();
      loadLocations();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save location.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLocation(location: Location) {
    if (!window.confirm(`Delete ${location.name}?`)) {
      return;
    }

    setErrorMessage("");
    setStatusMessage("");

    try {
      await locationsApi.deleteLocation(location.id);
      setLocations((current) => current.filter((entry) => entry.id !== location.id));
      if (editing?.id === location.id) {
        resetForm();
      }
      setStatusMessage(`Deleted ${location.name}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete location.");
    }
  }

  return (
    <div className="page-grid">
      <section className="section-card">
        <div className="section-heading">
          <h2>{editing ? `Edit: ${editing.name}` : "Add location"}</h2>
          {(editing || form.name || form.address) ? (
            <button className="secondary-button" onClick={resetForm} type="button">
              Clear
            </button>
          ) : null}
        </div>

        <div className="form-grid">
          <label>
            <span>Name</span>
            <input
              className="text-input"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label>
            <span>Address</span>
            <input
              className="text-input"
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            />
          </label>

          <label>
            <span>Table count</span>
            <input
              className="text-input"
              min={1}
              type="number"
              value={form.tableCount}
              onChange={(event) =>
                setForm((current) => ({ ...current, tableCount: Number(event.target.value) || 0 }))
              }
            />
          </label>

          <label>
            <span>Manager user id</span>
            <input
              className="text-input"
              min={1}
              type="number"
              value={form.managerId ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  managerId: event.target.value ? Number(event.target.value) : null,
                }))
              }
            />
          </label>
        </div>

        {statusMessage ? <p className="commerce-inline-status">{statusMessage}</p> : null}
        {errorMessage ? <p className="commerce-inline-status commerce-inline-status-error">{errorMessage}</p> : null}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button
            className="primary-button"
            disabled={saving || !form.name.trim() || !form.address.trim() || Number(form.tableCount) < 1}
            onClick={() => void saveLocation()}
            type="button"
          >
            {saving ? "Saving..." : editing ? "Save changes" : "Create location"}
          </button>
          <button className="secondary-button" onClick={loadLocations} type="button">
            Refresh
          </button>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>Locations ({locations.length})</h2>
        </div>

        {locations.length === 0 ? (
          <p>No locations found.</p>
        ) : (
          <div className="stack-list">
            {locations.map((location) => (
              <article className="line-item" key={location.id}>
                <div>
                  <h3>{location.name}</h3>
                  <p>{location.address}</p>
                  <p>
                    {location.tableCount} tables
                    {location.managerId ? ` • manager #${location.managerId}` : " • no manager assigned"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <button className="secondary-button" onClick={() => startEdit(location)} type="button">
                    Edit
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => void deleteLocation(location)}
                    style={{ color: "var(--error, #b33030)" }}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
