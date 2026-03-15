import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        ☕ Caffeinated Lions
      </NavLink>

      <ul className="navbar-links">
        <li><NavLink to="/menu">Menu</NavLink></li>
        <li><NavLink to="/locations">Locations</NavLink></li>
        <li><NavLink to="/reservations">Reserve</NavLink></li>
        <li><NavLink to="/feedback">Feedback</NavLink></li>
        {user ? (
          <>
            <li><NavLink to="/profile">Orders</NavLink></li>
            <li><NavLink to="/rewards">Rewards</NavLink></li>
            {user.roles.includes("Admin") && (
              <li><NavLink to="/admin" style={{ color: "var(--amber)", fontWeight: 700 }}>Admin</NavLink></li>
            )}
            <li>
              <button className="btn-secondary" style={{ padding: "0.3rem 0.8rem", fontSize: "0.9rem" }} onClick={handleLogout}>
                Log Out
              </button>
            </li>
          </>
        ) : (
          <>
            <li><NavLink to="/login">Log In</NavLink></li>
            <li><NavLink to="/signup">Sign Up</NavLink></li>
          </>
        )}
        <li>
          <NavLink to="/cart">
            <button className="navbar-cart-btn">
              🛒 {count > 0 ? count : "Cart"}
            </button>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
