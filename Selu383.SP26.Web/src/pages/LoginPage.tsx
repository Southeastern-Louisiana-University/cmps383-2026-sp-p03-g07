import { useEffect, useState } from "react";
import { useAuth } from "../store/authStore";
import type { PageProps } from "../types/router.types";
import { CommerceTopRail } from "./commerceShared";

export default function LoginPage({ navigate, query }: PageProps) {
  const { login, register, resetPassword } = useAuth();
  const currentHashPath = window.location.hash.slice(1).split("?")[0];
  const notice = query.get("notice") ?? "";
  const requestedMode =
    query.get("mode") === "register" || currentHashPath === "/signup"
      ? "register"
      : query.get("mode") === "reset" || currentHashPath === "/forgot-password"
        ? "reset"
        : "login";
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "reset">(requestedMode);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success">("error");

  useEffect(() => {
    setMode(requestedMode);
    setStatusMessage("");
    setStatusTone("error");

    if (notice === "password-reset" && requestedMode === "login") {
      setStatusTone("success");
      setStatusMessage("Password reset. You can sign in with your new password.");
    }
  }, [notice, requestedMode]);

  async function submitForm() {
    setStatusMessage("");
    setStatusTone("error");

    try {
      if (mode === "login") {
        await login(userName, password);
        navigate("/profile");
        return;
      }

      if (mode === "register") {
        const trimmedEmail = email.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedEmail || !trimmedPhone) {
          setStatusMessage("Email and phone number are required to register.");
          return;
        }

        await register(userName, password, trimmedEmail, trimmedPhone);
        navigate("/profile");
        return;
      }

      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();

      if (!trimmedEmail || !trimmedPhone) {
        setStatusMessage("Email and phone number are required to reset your password.");
        return;
      }

      if (!password.trim()) {
        setStatusMessage("Please enter a new password.");
        return;
      }

      if (password !== confirmPassword) {
        setStatusMessage("Passwords do not match.");
        return;
      }

      await resetPassword(userName, trimmedEmail, trimmedPhone, password);
      setPassword("");
      setConfirmPassword("");
      navigate("/login?notice=password-reset");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  return (
    <div className="commerce-page auth-page">
      <header className="commerce-topbar">
        <CommerceTopRail activeTab="account" navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <section className="commerce-hero auth-hero">
          <div className="commerce-hero-copy">
            <p className="commerce-kicker">Account access</p>
            <h1>
              {mode === "login"
                ? "SIGN IN TO YOUR ACCOUNT."
                : mode === "register"
                  ? "CREATE YOUR ACCOUNT."
                  : "RESET YOUR PASSWORD."}
            </h1>
            <p className="commerce-hero-description">
              Use the same account to connect rewards, orders, reservations, and account
              notifications across the whole Lions experience.
            </p>

            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">Rewards synced</span>
              <span className="commerce-hero-pill">Orders saved</span>
              <span className="commerce-hero-pill">Stay signed in across visits</span>
            </div>
          </div>

          <section className="commerce-panel auth-form-panel">
            <div className="auth-mode-toggle">
              <button
                className={mode === "login" ? "auth-mode-pill active" : "auth-mode-pill"}
                onClick={() => navigate("/login")}
                type="button"
              >
                Sign in
              </button>
              <button
                className={mode === "register" ? "auth-mode-pill active" : "auth-mode-pill"}
                onClick={() => navigate("/signup")}
                type="button"
              >
                Register
              </button>
              <button
                className={mode === "reset" ? "auth-mode-pill active" : "auth-mode-pill"}
                onClick={() => navigate("/forgot-password")}
                type="button"
              >
                Reset
              </button>
            </div>

            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Member portal</p>
                <h2>{mode === "login" ? "Welcome back" : mode === "register" ? "Create account" : "Reset password"}</h2>
              </div>
            </div>

            <div className="auth-form-grid">
              <label className="commerce-field">
                <span>Username</span>
                <input
                  autoComplete="username"
                  className="commerce-input"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                />
              </label>

              {mode === "register" || mode === "reset" ? (
                <label className="commerce-field">
                  <span>Email</span>
                  <input
                    autoComplete="email"
                    className="commerce-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              ) : null}

              {mode === "register" || mode === "reset" ? (
                <label className="commerce-field">
                  <span>Phone number</span>
                  <input
                    autoComplete="tel"
                    className="commerce-input"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </label>
              ) : null}

              <label className="commerce-field">
                <span>{mode === "reset" ? "New password" : "Password"}</span>
                <input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="commerce-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              {mode === "reset" ? (
                <label className="commerce-field">
                  <span>Confirm new password</span>
                  <input
                    autoComplete="new-password"
                    className="commerce-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
              ) : null}
            </div>

            {mode === "login" ? (
              <div className="auth-helper-row">
                <button className="cart-inline-link" onClick={() => navigate("/forgot-password")} type="button">
                  Forgot password?
                </button>
              </div>
            ) : null}

            {mode === "reset" ? (
              <div className="auth-helper-row">
                <button className="cart-inline-link" onClick={() => navigate("/login")} type="button">
                  Back to sign in
                </button>
              </div>
            ) : null}

            {statusMessage ? (
              <p className={`commerce-inline-status ${statusTone === "error" ? "commerce-inline-status-error" : "commerce-inline-status-success"}`}>
                {statusMessage}
              </p>
            ) : null}

            <button className="commerce-primary-button commerce-primary-button-block" onClick={submitForm} type="button">
              {mode === "login" ? "Sign in" : mode === "register" ? "Register and continue" : "Reset password"}
            </button>
          </section>
        </section>
      </section>
    </div>
  );
}
