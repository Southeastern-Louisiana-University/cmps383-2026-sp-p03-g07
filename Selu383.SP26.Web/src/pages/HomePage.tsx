import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div>
      <div className="hero">
        <h1>☕ Caffeinated Lions</h1>
        <p>Order ahead, skip the wait. Fresh coffee, baked goods, and warm vibes at every location.</p>
        <div className="hero-buttons">
          <Link to="/menu">
            <button className="btn-primary" style={{ fontSize: "1.05rem", padding: "0.8rem 2rem" }}>
              Browse Menu
            </button>
          </Link>
          <Link to="/reservations">
            <button className="btn-secondary" style={{ fontSize: "1.05rem", padding: "0.75rem 2rem", color: "white", borderColor: "white" }}>
              Reserve a Table
            </button>
          </Link>
        </div>
      </div>

      <div className="page" style={{ paddingTop: "3rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📱</div>
            <h3 style={{ color: "var(--espresso)", marginBottom: "0.5rem" }}>Order From Your Phone</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Walk in, scan, and order from your table. No waiting in line.</p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🏆</div>
            <h3 style={{ color: "var(--espresso)", marginBottom: "0.5rem" }}>Earn Rewards</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>1 point per $1 spent. Redeem for free drinks, pastries, and more.</p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📅</div>
            <h3 style={{ color: "var(--espresso)", marginBottom: "0.5rem" }}>Reserve a Table</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Book your spot at any of our locations in seconds.</p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🚗</div>
            <h3 style={{ color: "var(--espresso)", marginBottom: "0.5rem" }}>Drive-Thru</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Order ahead for drive-thru pickup - your coffee is ready when you arrive.</p>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <h2 style={{ color: "var(--espresso)", marginBottom: "1rem" }}>Find a Location Near You</h2>
          <Link to="/locations">
            <button className="btn-dark" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
              View All Locations
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
