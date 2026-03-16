import { useEffect, useMemo, useState, type ComponentType } from "react";
import "./App.css";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import RewardsPage from "./pages/RewardsPage";
import StoreMapPage from "./pages/StoreMapPage";
import LoginPage from "./pages/LoginPage";
import OrderHistory from "./pages/OrderHistory";
import OrderStatusPage from "./pages/OrderStatusPage";
import GiftCardPage from "./pages/GiftCardPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./admin/AdminDashboardPage";
import AdminOrdersPage from "./admin/AdminOrdersPage";
import AdminMenuManagementPage from "./admin/AdminMenuManagementPage";
import AdminReservationsPage from "./admin/AdminReservationsPage";
import AdminTablesPage from "./admin/AdminTablesPage";
import ReservationsPage from "./pages/ReservationsPage";
import { AuthProvider, useAuth } from "./store/authStore";
import { CartProvider, useCart } from "./store/cartStore";
import type { PageProps } from "./types/router.types";

type RouteDefinition = {
  path: string;
  label: string;
  element: ComponentType<PageProps>;
  protected?: boolean;
  adminOnly?: boolean;
  showInPrimaryNav?: boolean;
};

const routes: RouteDefinition[] = [
  { path: "/", label: "Home", element: HomePage, showInPrimaryNav: true },
  { path: "/menu", label: "Menu", element: MenuPage, showInPrimaryNav: true },
  { path: "/cart", label: "Cart", element: CartPage, showInPrimaryNav: true },
  { path: "/checkout", label: "Checkout", element: CheckoutPage, protected: true },
  { path: "/rewards", label: "Rewards", element: RewardsPage, showInPrimaryNav: true },
  { path: "/stores", label: "Stores", element: StoreMapPage, showInPrimaryNav: true },
  { path: "/login", label: "Login", element: LoginPage },
  { path: "/orders", label: "Orders", element: OrderHistory, protected: true, showInPrimaryNav: true },
  { path: "/order-status", label: "Track", element: OrderStatusPage, protected: true },
  { path: "/gift-cards", label: "Gift Cards", element: GiftCardPage, protected: true, showInPrimaryNav: true },
  { path: "/profile", label: "Profile", element: ProfilePage, protected: true },
  { path: "/reservations", label: "Reservations", element: ReservationsPage, protected: true, showInPrimaryNav: true },
  { path: "/admin", label: "Admin", element: AdminDashboardPage, protected: true, adminOnly: true, showInPrimaryNav: true },
  { path: "/admin/orders", label: "Admin Orders", element: AdminOrdersPage, protected: true, adminOnly: true },
  { path: "/admin/menu", label: "Admin Menu", element: AdminMenuManagementPage, protected: true, adminOnly: true },
  { path: "/admin/reservations", label: "Admin Reservations", element: AdminReservationsPage, protected: true, adminOnly: true },
  { path: "/admin/tables", label: "Admin Tables", element: AdminTablesPage, protected: true, adminOnly: true },
];

function getCurrentHashRoute() {
  const rawHash = window.location.hash.slice(1) || "/";
  const [path, queryString = ""] = rawHash.split("?");

  return {
    path: path.startsWith("/") ? path : `/${path}`,
    query: new URLSearchParams(queryString),
  };
}

function ShellMarkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <path
        d="M14 18h20v20H14z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="M18 18v-2.5C18 11.9 20.9 9 24.5 9s6.5 2.9 6.5 6.5V18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function AppLayout() {
  const { user, loading } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [routeState, setRouteState] = useState(getCurrentHashRoute);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setRouteState(getCurrentHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeRoute = useMemo(
    () => routes.find((route) => route.path === routeState.path) ?? routes[0],
    [routeState.path],
  );

  function navigate(path: string) {
    window.location.hash = path;
  }

  if (loading) {
    return (
      <div className="app-shell">
        <section className="section-card">
          <p className="eyebrow">Brewing your session</p>
          <h1>Loading account...</h1>
        </section>
      </div>
    );
  }

  const isAdmin = !!user?.roles.includes("Admin");
  const blockedByAuth =
    activeRoute.protected &&
    !user &&
    activeRoute.path !== "/checkout" &&
    activeRoute.path !== "/profile" &&
    activeRoute.path !== "/orders" &&
    activeRoute.path !== "/order-status" &&
    activeRoute.path !== "/gift-cards" &&
    activeRoute.path !== "/reservations";
  const blockedByRole = activeRoute.adminOnly && !isAdmin;
  const isImmersiveRoute =
    activeRoute.path === "/" ||
    activeRoute.path === "/stores" ||
    activeRoute.path === "/cart" ||
    activeRoute.path === "/rewards" ||
    activeRoute.path === "/menu" ||
    activeRoute.path === "/checkout" ||
    activeRoute.path === "/profile" ||
    activeRoute.path === "/login" ||
    activeRoute.path === "/orders" ||
    activeRoute.path === "/order-status" ||
    activeRoute.path === "/gift-cards" ||
    activeRoute.path === "/reservations";
  const Page = activeRoute.element;

  return (
    <div className={isImmersiveRoute ? "app-shell app-shell-immersive" : "app-shell"}>
      {isImmersiveRoute ? null : (
        <header className={scrolled ? "app-header app-header-scrolled" : "app-header"}>
          <div className="brand-cluster">
            <span className="shell-mark">
              <ShellMarkIcon />
            </span>
            <div className="brand-copy">
              <p className="eyebrow">SELU SP26 • house blend ordering</p>
              <button className="brand-button" onClick={() => navigate("/")} type="button">
                Caffeinated Lions
              </button>
            </div>
          </div>
          <nav className="top-nav">
            {routes
              .filter((route) => route.showInPrimaryNav && (!route.adminOnly || isAdmin))
              .map((route) => (
                <button
                  className={route.path === activeRoute.path ? "nav-link active" : "nav-link"}
                  key={route.path}
                  onClick={() => navigate(route.path)}
                  type="button"
                >
                  {route.label}
                </button>
              ))}
          </nav>
          <div className="status-cluster">
            <span className="header-route-pill">{activeRoute.label}</span>
            <button
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="theme-toggle"
              onClick={() => setIsDark((d) => !d)}
              type="button"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="secondary-button header-cart-button" onClick={() => navigate("/cart")} type="button">
              Cart{cartCount > 0 ? <span className="header-cart-badge">{cartCount}</span> : null}
            </button>
            <button className="secondary-button" onClick={() => navigate(user ? "/profile" : "/login")} type="button">
              {user ? `${user.userName} • ${user.points} pts` : "Login"}
            </button>
          </div>
        </header>
      )}

      <main className={isImmersiveRoute ? "main-content immersive-main" : "main-content"}>
        {blockedByAuth ? (
          <section className="section-card">
            <h1>Sign in required</h1>
            <p>This view needs an authenticated account.</p>
            <button className="primary-button" onClick={() => navigate("/login")} type="button">
              Go to login
            </button>
          </section>
        ) : blockedByRole ? (
          <section className="section-card">
            <h1>Admin access required</h1>
            <p>Your account is signed in, but it does not include the Admin role.</p>
          </section>
        ) : (
          <Page navigate={navigate} query={routeState.query} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppLayout />
      </CartProvider>
    </AuthProvider>
  );
}
