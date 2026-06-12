import { useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import CheckIn from "./pages/CheckIn";
import Journal from "./pages/Journal";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";

// ── Theme Context ─────────────────────────────────────────────────────────────
export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const theme = {
    dark,
    bg:          dark ? "#0f0a1e" : "#f5f3ff",
    card:        dark ? "#1a1035" : "#ffffff",
    border:      dark ? "#2d1f5e" : "#ede9fe",
    text:        dark ? "#e9d5ff" : "#4c1d95",
    muted:       dark ? "#7c6faa" : "#9ca3af",
    navBg:       dark ? "rgba(15,10,30,0.92)" : "rgba(255,255,255,0.85)",
    navBorder:   dark ? "rgba(109,40,217,0.3)" : "rgba(196,181,253,0.4)",
    inputBg:     dark ? "#1a1035" : "#ffffff",
    inputBorder: dark ? "#2d1f5e" : "#e9d5ff",
    purple:      "#8b5cf6",
    lavender:    "#a78bfa",
  };

  if (!loggedIn) return (
    <ThemeContext.Provider value={theme}>
      <Login onLogin={() => setLoggedIn(true)} />
    </ThemeContext.Provider>
  );

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ background: theme.bg, minHeight: "100vh", transition: "background 0.3s" }}>
        <BrowserRouter>
          <nav style={{
            padding: "12px 24px",
            display: "flex", gap: "8px", alignItems: "center",
            position: "sticky", top: 0, zIndex: 50,
            background: theme.navBg,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${theme.navBorder}`,
            boxShadow: "0 2px 16px rgba(139,92,246,0.08)"
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "8px" }}>
              <span style={{ fontSize: "20px" }}>🧠</span>
              <span style={{ fontWeight: 800, fontSize: "14px", color: theme.text }}>MindTrack</span>
            </div>

            {/* Links */}
            {[
              { to: "/dashboard", label: "📊 Dashboard" },
              { to: "/checkin",   label: "🏠 Check-in" },
              { to: "/journal",   label: "📓 Journal" },
              { to: "/chat",      label: "💬 Chat" },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{
                fontWeight: 600, fontSize: "13px",
                padding: "6px 12px", borderRadius: "12px",
                color: theme.purple, textDecoration: "none",
                transition: "background 0.2s",
              }}>
                {label}
              </Link>
            ))}

            {/* Right side */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Theme toggle */}
              <button onClick={toggleTheme} style={{
                background: dark ? "#2d1f5e" : "#ede9fe",
                border: "none", borderRadius: "999px",
                padding: "6px 14px", cursor: "pointer",
                fontSize: "14px", fontWeight: 600,
                color: theme.text, transition: "all 0.2s",
              }}>
                {dark ? "☀️ Light" : "🌙 Dark"}
              </button>

              {/* Logout */}
              <button onClick={() => { localStorage.removeItem("token"); setLoggedIn(false); }} style={{
                background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
                border: "none", borderRadius: "12px",
                padding: "7px 18px", cursor: "pointer",
                fontSize: "13px", fontWeight: 700,
                color: "white", boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
              }}>
                Logout
              </button>
            </div>
          </nav>

          <Routes>
            <Route path="/"          element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/checkin"   element={<CheckIn />} />
            <Route path="/journal"   element={<Journal />} />
            <Route path="/chat"      element={<Chat />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeContext.Provider>
  );
}