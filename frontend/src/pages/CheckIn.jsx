import { useState } from "react";
import axios from "axios";
import { useTheme } from "../App";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
const token = () => localStorage.getItem("token");

const quotes = [
  "Take care of your body. It's the only place you have to live.",
  "Mental health is not a destination, but a process.",
  "You don't have to be positive all the time.",
  "Self-care is how you take your power back.",
  "Every day is a second chance.",
];

const moodData = [
  { emoji: "😞", label: "Rough day",     color: "#ef4444" },
  { emoji: "😕", label: "A bit low",     color: "#f97316" },
  { emoji: "😐", label: "Neutral",       color: "#eab308" },
  { emoji: "🙂", label: "Pretty good",   color: "#22c55e" },
  { emoji: "😊", label: "Feeling great!", color: "#8b5cf6" },
];

export default function CheckIn() {
  const t = useTheme();
  const [sleep,  setSleep]  = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [saved,    setSaved]    = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [suggestions, setSuggestions] = useState("");

  const quote = quotes[new Date().getDay() % quotes.length];
  const moodIndex = Math.min(4, Math.round(((sleep + (10 - stress) + energy) / 30) * 4));
  const mood = moodData[moodIndex];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const submit = async () => {
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token()}` };
      const res = await axios.post(`${API}/checkin`,
        { sleep_score: sleep, stress_score: stress, energy_score: energy },
        { headers: h }
      );
      setSuggestions(res.data.suggestions || "");
      setSaved(true);
    } catch {
      alert("Could not save check-in. Please try again.");
    }
    setLoading(false);
  };

  const card = {
    borderRadius: "24px", padding: "24px",
    background: t.dark ? t.card : "rgba(255,255,255,0.82)",
    border: `1px solid ${t.border}`,
    boxShadow: t.dark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 20px rgba(139,92,246,0.08)",
  };

  if (saved) return (
    <div style={{ minHeight: "100vh", padding: "40px 16px", background: t.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: "440px", margin: "0 auto" }}>

        {/* Success card */}
        <div style={{ ...card, textAlign: "center", marginBottom: "16px", borderTop: "4px solid #22c55e" }}>
          <div style={{ fontSize: "72px", marginBottom: "12px" }}>{mood.emoji}</div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: t.text, margin: "0 0 8px" }}>Check-in Saved!</h2>
          <p style={{ fontSize: "13px", color: t.muted, marginBottom: "20px" }}>Great job taking care of yourself today 💜</p>

          {/* Score cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "Sleep",  value: sleep,  color: "#8b5cf6", bg: t.dark ? "#2d1f5e" : "#f5f0ff" },
              { label: "Stress", value: stress, color: "#ef4444", bg: t.dark ? "#3b0a0a" : "#fef2f2" },
              { label: "Energy", value: energy, color: "#22c55e", bg: t.dark ? "#052e16" : "#f0fdf4" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ borderRadius: "14px", padding: "14px", textAlign: "center", background: bg }}>
                <p style={{ fontSize: "22px", fontWeight: 800, color, margin: "0 0 4px" }}>{value}</p>
                <p style={{ fontSize: "12px", color: t.muted, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: "14px", padding: "12px", background: t.bg }}>
            <p style={{ fontSize: "12px", color: t.muted, margin: "0 0 4px" }}>Today's mood</p>
            <p style={{ fontSize: "15px", fontWeight: 700, color: mood.color, margin: 0 }}>{mood.label}</p>
          </div>
        </div>

        {/* AI Suggestions */}
        {suggestions && (
          <div style={{ ...card, marginBottom: "16px", borderLeft: "4px solid #8b5cf6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #8b5cf6, #a78bfa)", flexShrink: 0 }}>
                <span style={{ fontSize: "16px" }}>🧠</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "14px", color: t.text, margin: 0 }}>Personalized Suggestions</p>
                <p style={{ fontSize: "12px", color: "#a78bfa", margin: 0 }}>Based on your scores today</p>
              </div>
            </div>
            <div style={{ borderRadius: "14px", padding: "14px", background: t.bg, border: `1px solid ${t.border}` }}>
              {suggestions.split("\n").filter(l => l.trim()).map((line, i) => (
                <p key={i} style={{ fontSize: "13px", lineHeight: 1.7, color: t.text, margin: "0 0 8px" }}>{line}</p>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => { setSaved(false); setSuggestions(""); }} style={{
          width: "100%", padding: "14px", borderRadius: "16px", border: "none",
          background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
          color: "white", fontSize: "15px", fontWeight: 700,
          cursor: "pointer", boxShadow: "0 8px 24px rgba(139,92,246,0.3)",
        }}>
          Check in again
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", padding: "40px 16px", background: t.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: "440px", margin: "0 auto" }}>

        {/* Greeting */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: t.muted, marginBottom: "4px" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: t.text, margin: 0 }}>{greeting} 👋</h1>
          <p style={{ fontSize: "13px", color: t.muted, marginTop: "4px" }}>How are you feeling today?</p>
        </div>

        {/* Mood preview */}
        <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.muted, marginBottom: "4px" }}>Overall mood</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: mood.color, margin: 0 }}>{mood.label}</p>
            <p style={{ fontSize: "11px", color: "#a78bfa", marginTop: "4px" }}>Updates as you adjust sliders</p>
          </div>
          <span style={{ fontSize: "60px" }}>{mood.emoji}</span>
        </div>

        {/* Sliders */}
        <div style={{ ...card, marginBottom: "16px" }}>
          <div style={{ height: "2px", borderRadius: "999px", background: "linear-gradient(to right, transparent, #c4b5fd, transparent)", marginBottom: "20px" }} />

          {[
            { label: "Sleep quality", icon: "😴", value: sleep,  onChange: setSleep,  color: "#8b5cf6", bg: t.dark ? "#2d1f5e" : "#f5f0ff" },
            { label: "Stress level",  icon: "🧠", value: stress, onChange: setStress, color: "#ef4444", bg: t.dark ? "#3b0a0a" : "#fef2f2" },
            { label: "Energy level",  icon: "⚡", value: energy, onChange: setEnergy, color: "#22c55e", bg: t.dark ? "#052e16" : "#f0fdf4" },
          ].map(({ label, icon, value, onChange, color, bg }, i, arr) => (
            <div key={label} style={{ marginBottom: i < arr.length - 1 ? "24px" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: bg, fontSize: "16px" }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: t.text }}>{label}</span>
                </div>
                <span style={{ fontSize: "18px", fontWeight: 800, color }}>
                  {value}<span style={{ fontSize: "11px", fontWeight: 400, color: t.muted }}>/10</span>
                </span>
              </div>
              <input type="range" min="1" max="10" value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{
                  width: "100%", height: "8px", borderRadius: "999px",
                  appearance: "none", cursor: "pointer",
                  background: `linear-gradient(to right, ${color} ${(value - 1) / 9 * 100}%, ${t.dark ? "#2d1f5e" : "#ede9fe"} ${(value - 1) / 9 * 100}%)`,
                  accentColor: color,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ fontSize: "11px", color: t.muted }}>Low</span>
                <span style={{ fontSize: "11px", color: t.muted }}>High</span>
              </div>
            </div>
          ))}
        </div>

        {/* Score summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: "Sleep",  value: sleep,  color: "#8b5cf6" },
            { label: "Stress", value: stress, color: "#ef4444" },
            { label: "Energy", value: energy, color: "#22c55e" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: "14px", textAlign: "center" }}>
              <p style={{ fontSize: "24px", fontWeight: 800, color, margin: "0 0 4px" }}>{value}</p>
              <p style={{ fontSize: "12px", color: t.muted, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Save button */}
        <button onClick={submit} disabled={loading} style={{
          width: "100%", padding: "16px", borderRadius: "16px", border: "none",
          background: loading ? "#c4b5fd" : "linear-gradient(135deg, #8b5cf6, #a78bfa)",
          color: "white", fontSize: "16px", fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 8px 24px rgba(139,92,246,0.35)",
          marginBottom: "16px",
        }}>
          {loading ? "Saving & getting suggestions..." : "Save Today's Check-in →"}
        </button>

        {/* Quote */}
        <div style={{ ...card, textAlign: "center", padding: "16px" }}>
          <p style={{ fontSize: "11px", color: "#a78bfa", marginBottom: "6px" }}>✦ Daily reminder</p>
          <p style={{ fontSize: "13px", fontStyle: "italic", color: t.muted, margin: 0 }}>"{quote}"</p>
        </div>
      </div>
    </div>
  );
}
