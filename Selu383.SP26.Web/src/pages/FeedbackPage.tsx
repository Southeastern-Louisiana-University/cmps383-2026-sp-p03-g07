import { useState } from "react";
import { useAuth } from "../store/authStore";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

const CATEGORIES = ["Coffee Quality", "Food", "Service", "Atmosphere", "Cleanliness", "Overall"];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="feedback-stars" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`feedback-star${n <= (hovered || value) ? " feedback-star-filled" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function FeedbackPage({ navigate }: PageProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[5]);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(user?.userName ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="commerce-page feedback-page">
        <header className="commerce-topbar">
          <StorefrontTopRail navigate={navigate} />
        </header>
        <section className="commerce-canvas">
          <div className="feedback-thanks">
            <div className="feedback-thanks-icon">☕</div>
            <h1>Thank you for your feedback!</h1>
            <p>Your thoughts help us brew a better experience for everyone.</p>
            <div className="feedback-thanks-rating">
              {"★".repeat(rating)}{"☆".repeat(5 - rating)}
            </div>
            <div className="feedback-thanks-actions">
              <button className="commerce-primary-button" onClick={() => navigate("/")} type="button">
                Back to home
              </button>
              <button className="commerce-secondary-button" onClick={() => { setSubmitted(false); setRating(0); setComment(""); }} type="button">
                Leave another review
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="commerce-page feedback-page">
      <header className="commerce-topbar">
        <StorefrontTopRail navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <div className="feedback-notice">
          <span className="feedback-notice-icon">i</span>
          <span>Feedback submissions are not yet saved - backend integration coming soon. Your response won't be stored at this time.</span>
        </div>

        <section className="commerce-hero feedback-hero">
          <div className="commerce-hero-copy">
            <p className="commerce-kicker">Your voice matters</p>
            <h1>SHARE YOUR EXPERIENCE.</h1>
            <p className="commerce-hero-description">
              Every cup, every visit, every moment - tell us how we did.
              Your feedback shapes the Lions experience.
            </p>
            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">Anonymous welcome</span>
              <span className="commerce-hero-pill">Instant submission</span>
              <span className="commerce-hero-pill">Helps us improve</span>
            </div>
          </div>

          <section className="commerce-panel feedback-form-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Feedback form</p>
                <h2>Rate your visit</h2>
              </div>
            </div>

            <div className="feedback-form-body">
              <div className="feedback-rating-section">
                <p className="feedback-label">Overall rating</p>
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && (
                  <p className="feedback-rating-label">{STAR_LABELS[rating]}</p>
                )}
              </div>

              <label className="commerce-field">
                <span>Category</span>
                <select
                  className="commerce-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="commerce-field">
                <span>Your name {!user && <span className="feedback-optional">(optional)</span>}</span>
                <input
                  className="commerce-input"
                  placeholder={user ? user.userName : "Anonymous"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="commerce-field">
                <span>Tell us more <span className="feedback-optional">(optional)</span></span>
                <textarea
                  className="commerce-input feedback-textarea"
                  placeholder="What did you love? What could be better?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </label>

              {rating === 0 && (
                <p className="commerce-inline-status commerce-inline-status-error">Please select a star rating to continue.</p>
              )}

              <button
                className="commerce-primary-button commerce-primary-button-block"
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                type="button"
              >
                {submitting ? "Submitting..." : "Submit feedback"}
              </button>
            </div>
          </section>
        </section>
      </section>
    </div>
  );
}
