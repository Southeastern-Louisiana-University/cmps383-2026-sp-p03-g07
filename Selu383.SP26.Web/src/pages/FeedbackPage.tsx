import { useState } from "react";
import { API_BASE_URL } from "../services/api";

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating."); return; }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
    } catch {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💛</div>
        <h2 style={{ color: "var(--espresso)", marginBottom: "0.75rem" }}>Thanks for your feedback!</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>We appreciate you taking the time to share your experience.</p>
        <button className="btn-primary" onClick={() => { setSuccess(false); setRating(0); setComment(""); }}>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Leave Feedback</h1>
      <div style={{ maxWidth: "520px" }}>
        <form onSubmit={handleSubmit} className="card">
          <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            How was your experience? Your feedback helps us improve.
          </p>

          <div className="form-group">
            <label>Rating</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= (hovered || rating) ? "active" : ""}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Comment (optional)</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your visit..."
              style={{ resize: "vertical" }}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
