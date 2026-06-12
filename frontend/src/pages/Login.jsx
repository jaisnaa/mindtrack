import { useState, useContext } from "react";
import axios from "axios";
import { ThemeContext } from "../App";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function Login({ onLogin }) {
  const t = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const url = isRegister ? "/register" : "/login";
      const res = await axios.post(API + url, { email, password });
      localStorage.setItem("token", res.data.token);
      onLogin();
    } catch (e) {
      setError(e.response?.data?.detail || "Something went wrong");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", borderRadius: "16px",
    padding: "12px 12px 12px 40px",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
    background: t.dark ? "#1a1035" : "rgba(245,240,255,0.8)",
    border: `1px solid ${t.dark ? "#2d1f5e" : "rgba(196,181,253,0.5)"}`,
    color: t.text, transition: "border 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "16px",
      position: "relative", overflow: "hidden",
      background: t.dark
        ? "linear-gradient(135deg, #0f0a1e 0%, #1a0f35 50%, #0f0a1e 100%)"
        : "linear-gradient(135deg, #f5f0ff 0%, #ede9fe 50%, #f3f0ff 100%)",
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Blobs */}
      <div style={{ position: "absolute", top: "-60px", left: "-60px", width: "320px", height: "320px", borderRadius: "50%", opacity: 0.15, background: "radial-gradient(circle, #c4b5fd, transparent)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-60px", right: "-40px", width: "288px", height: "288px", borderRadius: "50%", opacity: 0.15, background: "radial-gradient(circle, #ddd6fe, transparent)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "80px", height: "80px", borderRadius: "24px", marginBottom: "16px",
            background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
            boxShadow: "0 8px 24px rgba(139,92,246,0.35)",
          }}>
            <span style={{ fontSize: "36px" }}>🧠</span>
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: t.text, margin: 0 }}>MindTrack</h1>
          <p style={{ marginTop: "8px", fontSize: "13px", color: t.muted, letterSpacing: "0.04em" }}>
            ✦ Your personal mental wellness companion ✦
          </p>
        </div>

        {/* Card */}
        <div style={{
          borderRadius: "28px", padding: "32px", position: "relative",
          background: t.dark ? "rgba(26,16,53,0.95)" : "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${t.dark ? "#2d1f5e" : "rgba(196,181,253,0.4)"}`,
          boxShadow: t.dark
            ? "0 20px 60px rgba(0,0,0,0.5)"
            : "0 20px 60px rgba(139,92,246,0.10)",
        }}>
          {/* Top decorative line */}
          <div style={{ position: "absolute", top: 0, left: "32px", right: "32px", height: "2px", borderRadius: "999px", background: "linear-gradient(to right, transparent, #c4b5fd, transparent)" }} />
          <div style={{ position: "absolute", top: "16px", right: "16px", color: t.dark ? "#2d1f5e" : "#ddd6fe", userSelect: "none" }}>✦</div>
          <div style={{ position: "absolute", bottom: "16px", left: "16px", color: t.dark ? "#2d1f5e" : "#ede9fe", fontSize: "13px", userSelect: "none" }}>✦</div>

          <h2 style={{ fontSize: "22px", fontWeight: 700, color: t.text, margin: "0 0 4px" }}>
            {isRegister ? "Create account 👋" : "Welcome back 👋"}
          </h2>
          <p style={{ fontSize: "13px", color: t.muted, marginBottom: "24px" }}>
            {isRegister ? "Begin your wellness journey today" : "Good to see you again"}
          </p>

          {error && (
            <div style={{ fontSize: "13px", borderRadius: "12px", padding: "10px 14px", marginBottom: "16px", background: t.dark ? "#450a0a" : "#fef2f2", color: "#ef4444", border: "1px solid rgba(252,165,165,0.5)" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: t.muted, marginBottom: "8px" }}>Email</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "11px", fontSize: "16px" }}>✉️</span>
              <input style={inputStyle} placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: t.muted, marginBottom: "8px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "11px", fontSize: "16px" }}>🔒</span>
              <input style={{ ...inputStyle, paddingRight: "44px" }}
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()} />
              <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "11px", cursor: "pointer", fontSize: "16px", userSelect: "none" }}>
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button onClick={submit} disabled={loading} style={{
            width: "100%", padding: "14px", borderRadius: "16px", border: "none",
            background: loading ? "#c4b5fd" : "linear-gradient(135deg, #8b5cf6, #a78bfa)",
            color: "white", fontSize: "16px", fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 8px 24px rgba(139,92,246,0.35)",
            opacity: loading ? 0.8 : 1, transition: "opacity 0.2s",
          }}>
            {loading ? "Please wait..." : isRegister ? "Create Account →" : "Login →"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0" }}>
            <div style={{ flex: 1, height: "1px", background: t.border }} />
            <span style={{ fontSize: "12px", color: t.muted }}>or</span>
            <div style={{ flex: 1, height: "1px", background: t.border }} />
          </div>

          <p style={{ textAlign: "center", fontSize: "13px", color: t.muted, margin: 0 }}>
            {isRegister ? "Already have an account? " : "New here? "}
            <span onClick={() => { setIsRegister(!isRegister); setError(""); }}
              style={{ fontWeight: 700, color: "#8b5cf6", cursor: "pointer" }}>
              {isRegister ? "Login" : "Sign up free"}
            </span>
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "24px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#a78bfa" }}>🔒 Private & encrypted</span>
          <span style={{ color: t.muted }}>·</span>
          <span style={{ fontSize: "12px", color: "#a78bfa" }}>💜 Made with care</span>
          <span style={{ color: t.muted }}>·</span>
          <span style={{ fontSize: "12px", color: "#a78bfa" }}>🌿 Stay well</span>
        </div>
      </div>
    </div>
  );
}
