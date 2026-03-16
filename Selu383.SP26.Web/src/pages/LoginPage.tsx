import { useEffect, useState } from "react";
import { useAuth } from "../store/authStore";
import type { PageProps } from "../types/router.types";
import { StorefrontTopRail } from "./storefrontShared";

export default function LoginPage({ navigate, query }: PageProps) {
  const { login, register } = useAuth();
  const requestedMode = query.get("mode") === "register" ? "register" : "login";
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">(requestedMode);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setMode(requestedMode);
  }, [requestedMode]);

  async function submitForm() {
    try {
      if (mode === "login") {
        await login(userName, password);
      } else {
        await register(userName, password);
      }

      navigate("/profile");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  return (
    <div className="commerce-page auth-page">
      <header className="commerce-topbar">
        <StorefrontTopRail activeTab="account" navigate={navigate} />
      </header>

      <section className="commerce-canvas">
        <section className="commerce-hero auth-hero">
          <div className="commerce-hero-copy">
            <p className="commerce-kicker">Account access</p>
            <h1>{mode === "login" ? "SIGN IN TO THE STOREFRONT." : "CREATE YOUR STOREFRONT ACCOUNT."}</h1>
            <p className="commerce-hero-description">
              Use the same account to connect rewards, orders, reservations, gift cards, and account
              notifications across the whole Lions experience.
            </p>

            <div className="commerce-hero-pills">
              <span className="commerce-hero-pill">Rewards synced</span>
              <span className="commerce-hero-pill">Orders saved</span>
              <span className="commerce-hero-pill">Cookie auth enabled</span>
            </div>
          </div>

          <section className="commerce-panel auth-form-panel">
            <div className="auth-mode-toggle">
              <button
                className={mode === "login" ? "auth-mode-pill active" : "auth-mode-pill"}
                onClick={() => setMode("login")}
                type="button"
              >
                Sign in
              </button>
              <button
                className={mode === "register" ? "auth-mode-pill active" : "auth-mode-pill"}
                onClick={() => setMode("register")}
                type="button"
              >
                Register
              </button>
            </div>

            <div className="commerce-panel-heading">
              <div>
                <p className="commerce-panel-kicker">Member portal</p>
                <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
              </div>
            </div>

            <div className="auth-form-grid">
              <label className="commerce-field">
                <span>Username</span>
                <input
                  className="commerce-input"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                />
              </label>

              <label className="commerce-field">
                <span>Password</span>
                <input
                  className="commerce-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            </div>

            {statusMessage ? <p className="commerce-inline-status commerce-inline-status-error">{statusMessage}</p> : null}

            <button className="commerce-primary-button commerce-primary-button-block" onClick={submitForm} type="button">
              {mode === "login" ? "Sign in" : "Register and continue"}
            </button>
          </section>
        </section>
      </section>
    </div>
  );
}
