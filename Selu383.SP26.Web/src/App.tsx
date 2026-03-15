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
  { path: "/admin", label: "Admin", element: AdminDashboardPage, protected: true, adminOnly: true, showInPrimaryNav: true },
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

function AppLayout() {
  const { user, loading } = useAuth();
  const { items } = useCart();
  const [routeState, setRouteState] = useState(getCurrentHashRoute);

  useEffect(() => {
    const handleHashChange = () => setRouteState(getCurrentHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
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
    activeRoute.path !== "/gift-cards";
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
    activeRoute.path === "/gift-cards";
  const Page = activeRoute.element;

  return (
    <div className={isImmersiveRoute ? "app-shell app-shell-immersive" : "app-shell"}>
      {isImmersiveRoute ? null : (
        <header className="app-header">
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
            <button className="secondary-button" onClick={() => navigate("/cart")} type="button">
              Cart ({items.length})
            </button>
            <button className="secondary-button" onClick={() => navigate(user ? "/profile" : "/login")} type="button">
              {user ? `${user.userName} • ${user.points} stars` : "Login"}
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
