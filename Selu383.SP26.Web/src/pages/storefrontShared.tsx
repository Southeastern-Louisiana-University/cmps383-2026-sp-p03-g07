import { useCart } from "../store/cartStore";
import type { Location } from "../types/location.types";
import type { PageProps } from "../types/router.types";

export type StoreProfile = {
  district: string;
  hours: string;
  pickup: string;
  feature: string;
  blurb: string;
  phone: string;
  directoryName: string[];
  weeklyHours: Array<{ day: string; hours: string }>;
  icon: "classic" | "townhouse" | "arch";
};

export const fallbackLocations: Location[] = [
  {
    id: 1,
    name: "Hammond",
    address: "123 Main St, Hammond, LA",
    tableCount: 10,
  },
  {
    id: 2,
    name: "Covington",
    address: "456 Oak Ave, Covington, LA",
    tableCount: 20,
  },
  {
    id: 3,
    name: "Baton Rouge",
    address: "789 Pine Ln, Baton Rouge, LA",
    tableCount: 15,
  },
];

const featuredProfiles: StoreProfile[] = [
  {
    district: "Hammond",
    hours: "Open 6 AM - 9 PM",
    pickup: "Reservations available",
    feature: "Fastest stop for commuter coffee and early classes.",
    blurb: "Built for dine-in sessions, weekday studying, and a reliable first pour before campus wakes up.",
    phone: "985 555 0101",
    directoryName: ["Bakery &", "Coffeehouse"],
    weeklyHours: [
      { day: "MO-FR", hours: "06.00 - 21.00" },
      { day: "Saturday", hours: "07.00 - 20.00" },
      { day: "Sunday", hours: "08.00 - 18.00" },
    ],
    icon: "classic",
  },
  {
    district: "Covington",
    hours: "Open 7 AM - 8 PM",
    pickup: "Reservations available",
    feature: "Patio-friendly mornings with the calmest dine-in pace.",
    blurb: "A softer Northshore room with longer brunch hangs, lighter traffic, and easy pickup shelves near the door.",
    phone: "985 555 0102",
    directoryName: ["Bakery &", "Coffeehouse"],
    weeklyHours: [
      { day: "MO-FR", hours: "07.00 - 20.00" },
      { day: "Saturday", hours: "08.00 - 19.00" },
      { day: "Sunday", hours: "09.00 - 18.00" },
    ],
    icon: "townhouse",
  },
  {
    district: "Baton Rouge",
    hours: "Open 7 AM - 8 PM",
    pickup: "Reservations available",
    feature: "Best fit for team orders, laptops, and bigger meetups.",
    blurb: "The roomiest of the three, with more seating, bigger pickup bursts, and enough space to turn a stop into a session.",
    phone: "225 555 0103",
    directoryName: ["Bakery"],
    weeklyHours: [
      { day: "MO-FR", hours: "07.00 - 20.00" },
      { day: "Saturday", hours: "08.00 - 19.00" },
      { day: "Sunday", hours: "09.00 - 18.00" },
    ],
    icon: "arch",
  },
];

const locationProfiles: Record<number, StoreProfile> = {
  1: featuredProfiles[0],
  2: featuredProfiles[1],
  3: featuredProfiles[2],
};

type StorefrontRailProps = {
  activeTab?: "locations" | "reserve" | "order" | "rewards" | "account" | "feedback";
  navigate: PageProps["navigate"];
  labels?: Partial<{
    locations: string;
    reserve: string;
    order: string;
    rewards: string;
    account: string;
    feedback: string;
  }>;
};

export function getDirectionsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function getProfile(location: Location, index: number) {
  const fallback = featuredProfiles[index % featuredProfiles.length];
  const matchedProfile = locationProfiles[location.id];

  if (matchedProfile) {
    return matchedProfile;
  }

  const [, city = fallback.district] = location.address.split(",");
  return {
    ...fallback,
    district: city.trim() || fallback.district,
  };
}

function getLinkClass(isActive: boolean) {
  return isActive ? "store-rail-link active" : "store-rail-link";
}

export function StoreBagIcon() {
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

export function StoreBasketIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <path
        d="M14 18h20l-2 18H16z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="M19 18l5-7 5 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

export function StoreOrderIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96">
      <path
        d="M18 26h60v44H18z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M30 18h36v12H30z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M24 34h48"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M29 45h8M42 45h8M55 45h8M29 56h8M42 56h8M55 56h8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
    </svg>
  );
}

export function StoreLocationIcon({ variant }: { variant: StoreProfile["icon"] }) {
  if (variant === "townhouse") {
    return (
      <svg aria-hidden="true" viewBox="0 0 180 110">
        <path
          d="M18 86h144M24 84V34h132v50M18 28h144l-6 8H24zM58 34v50M92 34v50M126 34v50"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
        <path
          d="M35 42h20v34H35zM77 38h26v46H77zM117 42h20v34h-20z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </svg>
    );
  }

  if (variant === "arch") {
    return (
      <svg aria-hidden="true" viewBox="0 0 180 110">
        <path
          d="M28 84h124M36 84V48c0-15 10-25 22-25s22 10 22 25v36M82 84V43c0-14 18-23 40-23s40 9 40 23v41"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
        <path
          d="M44 84V48c0-9 6-15 14-15s14 6 14 15v36M94 84V44c0-8 12-13 28-13s28 5 28 13v40"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
        <path
          d="M53 53h10M114 53h16M53 63h10M114 63h16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 180 110">
      <path
        d="M22 84h136M30 84V32h120v52M24 26h132v8H24zM54 32v52M126 32v52"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M40 40h28v34H40zM78 38h24v38H78zM112 40h28v34h-28z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M40 48h28M112 48h28"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function StorefrontTopRail({ activeTab, navigate, labels: labelOverrides }: StorefrontRailProps) {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const labels = {
    locations: "Locations",
    reserve: "Reservation",
    order: "Order Online",
    rewards: "Rewards",
    account: "Account",
    feedback: "Feedback",
  };
  const resolvedLabels = { ...labels, ...labelOverrides };

  return (
    <div className="store-top-rail">
      <button aria-label="Go home" className="store-mark" onClick={() => navigate("/")} type="button">
        <span className="store-mark-icon">
          <StoreBagIcon />
        </span>
      </button>

      <nav className="store-rail-links store-rail-links-primary" aria-label="Storefront navigation">
        <button className={getLinkClass(activeTab === "order")} onClick={() => navigate("/menu")} type="button">
          {resolvedLabels.order}
        </button>
        <button className={getLinkClass(activeTab === "reserve")} onClick={() => navigate("/checkout")} type="button">
          {resolvedLabels.reserve}
        </button>
        <button className={getLinkClass(activeTab === "locations")} onClick={() => navigate("/stores")} type="button">
          {resolvedLabels.locations}
        </button>
      </nav>

      <div className="store-rail-spacer" />

      <nav className="store-rail-links store-rail-links-secondary" aria-label="Account links">
        <button className={getLinkClass(activeTab === "feedback")} onClick={() => navigate("/feedback")} type="button">
          {resolvedLabels.feedback}
        </button>
        <button className={getLinkClass(activeTab === "rewards")} onClick={() => navigate("/rewards")} type="button">
          {resolvedLabels.rewards}
        </button>
        <button className={getLinkClass(activeTab === "account")} onClick={() => navigate("/profile")} type="button">
          {resolvedLabels.account}
        </button>
      </nav>

      <div className="store-rail-tools">
        <button aria-label={`Open cart${cartCount > 0 ? `, ${cartCount} items` : ""}`} className="store-basket" onClick={() => navigate("/cart")} type="button" style={{ position: "relative" }}>
          <StoreBasketIcon />
          {cartCount > 0 && (
            <span className="store-basket-badge">{cartCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}
