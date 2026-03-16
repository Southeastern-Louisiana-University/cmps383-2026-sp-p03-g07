import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

type Review = {
  id: number;
  name: string;
  rating: number;
  location: string;
  favoriteOrder: string;
  quote: string;
};

const reviews: Review[] = [
  {
    id: 1,
    name: "Maya T.",
    rating: 5,
    location: "Hammond",
    favoriteOrder: "Honey Cinnamon Latte",
    quote:
      "The atmosphere is amazing and the coffee is always smooth. This is my go-to spot before class every week.",
  },
  {
    id: 2,
    name: "Jordan P.",
    rating: 5,
    location: "Downtown",
    favoriteOrder: "Cold Brew",
    quote:
      "Fast service, great staff, and the cold brew actually tastes strong without being bitter. Easily one of my favorite coffee places.",
  },
  {
    id: 3,
    name: "Ariana L.",
    rating: 4,
    location: "Campus",
    favoriteOrder: "Vanilla Iced Latte",
    quote:
      "Really clean design, good music, and drinks that are consistent every time. I also like how easy ordering is.",
  },
  {
    id: 4,
    name: "Chris W.",
    rating: 5,
    location: "Hammond",
    favoriteOrder: "Caramel Macchiato",
    quote:
      "The branding pulled me in, but the quality made me come back. The espresso drinks are legit.",
  },
  {
    id: 5,
    name: "Natalie R.",
    rating: 5,
    location: "Drive-Thru",
    favoriteOrder: "Mocha Freeze",
    quote:
      "Perfect when I’m in a rush. The drive-thru is quick and my order has been right every single time.",
  },
  {
    id: 6,
    name: "Ethan M.",
    rating: 4,
    location: "Campus",
    favoriteOrder: "Iced Matcha Latte",
    quote:
      "Nice variety, solid rewards experience, and the drinks look as good as they taste.",
  },
];

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function ReviewsPage({ navigate }: PageProps) {
  return (
    <div className="store-showcase">
      <section className="store-hero">
        <StorefrontTopRail navigate={navigate} />

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "3rem 1.5rem 4rem",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "2.5rem",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontSize: "0.85rem",
              }}
            >
              Customer Favorites
            </p>

            <h1
              style={{
                margin: "0.5rem 0 0.75rem",
                fontSize: "clamp(2.5rem, 6vw, 4.75rem)",
                lineHeight: 1,
                color: "var(--accent-gold-light)",
              }}
            >
              Reviews
            </h1>

            <p
              style={{
                maxWidth: "700px",
                margin: "0 auto",
                color: "var(--text-soft)",
                fontSize: "1.05rem",
              }}
            >
              See what guests are saying about Caffeinated Lions, from handcrafted
              espresso drinks to quick drive-thru runs and cozy study sessions.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {reviews.map((review) => (
              <article
                key={review.id}
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "24px",
                  padding: "1.5rem",
                  boxShadow: "var(--shadow)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    color: "var(--accent-gold-light)",
                    fontSize: "1.1rem",
                    letterSpacing: "0.08em",
                    marginBottom: "0.75rem",
                  }}
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {renderStars(review.rating)}
                </div>

                <p
                  style={{
                    color: "var(--text-main)",
                    fontSize: "1rem",
                    lineHeight: 1.7,
                    marginBottom: "1.25rem",
                  }}
                >
                  “{review.quote}”
                </p>

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1rem",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "1.15rem",
                      marginBottom: "0.35rem",
                      color: "var(--accent-gold-light)",
                    }}
                  >
                    {review.name}
                  </h2>

                  <p
                    style={{
                      margin: "0 0 0.2rem",
                      color: "var(--text-soft)",
                    }}
                  >
                    <strong>Location:</strong> {review.location}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "var(--text-soft)",
                    }}
                  >
                    <strong>Favorite Order:</strong> {review.favoriteOrder}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div
            style={{
              marginTop: "3rem",
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/menu")}
              style={{
                border: "1px solid var(--accent-gold)",
                background: "linear-gradient(180deg, #d8bb74, #ac8540)",
                color: "#1f2710",
                padding: "0.9rem 1.5rem",
                borderRadius: "999px",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              Order Your Favorite
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}