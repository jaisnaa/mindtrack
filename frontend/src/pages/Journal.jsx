import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../App";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const SentimentBadge = ({ label, score }) => {
  if (!label) return null;
  const config = {
    Positive: { bg: "#f0fdf4", darkBg: "#052e16", color: "#16a34a", border: "rgba(134,239,172,0.5)", emoji: "😊" },
    Negative: { bg: "#fef2f2", darkBg: "#450a0a", color: "#dc2626", border: "rgba(252,165,165,0.5)", emoji: "😔" },
    Neutral:  { bg: "#f5f0ff", darkBg: "#2d1f5e", color: "#7c3aed", border: "rgba(196,181,253,0.5)", emoji: "😐" },
  };
  const c = config[label] || config.Neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "3px 10px", borderRadius: "8px",
      fontSize: "12px", fontWeight: 600,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
    }}>
      {c.emoji} {label} {score}%
    </span>
  );
};

export default function Journal() {
  const t = useTheme();
  const [text, setText]     = useState("");
  const [entries, setEntries] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);

  useEffect(() => {
    axios.get(`${API}/entries`, { headers: headers() }).then(r => setEntries(r.data));
  }, []);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await axios.post(`${API}/entry`, { content: text }, { headers: headers() });
    setText("");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    const r = await axios.get(`${API}/entries`, { headers: headers() });
    setEntries(r.data);
    setSaving(false);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "Z");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr + "Z")) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const card = {
    borderRadius: "24px", padding: "24px",
    background: t.dark ? t.card : "rgba(255,255,255,0.85)",
    border: `1px solid ${t.border}`,
    boxShadow: t.dark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 8px 32px rgba(139,92,246,0.10)",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "40px 16px", background: t.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: t.muted, marginBottom: "4px" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: t.text, margin: 0 }}>📓 My Journal</h1>
          <p style={{ fontSize: "13px", color: t.muted, marginTop: "4px" }}>Write freely — this is your safe space</p>
        </div>

        {/* Write card */}
        <div style={{ ...card, position: "relative", marginBottom: "24px" }}>
          <div style={{ position: "absolute", top: 0, left: "32px", right: "32px", height: "2px", borderRadius: "999px", background: "linear-gradient(to right, transparent, #c4b5fd, transparent)" }} />
          <div style={{ position: "absolute", top: "14px", right: "16px", color: t.dark ? "#2d1f5e" : "#ddd6fe", userSelect: "none" }}>✦</div>

          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: t.muted, marginBottom: "12px" }}>
            ✏️ Today's entry
          </label>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="How are you feeling today? What's on your mind? 💭"
            style={{
              width: "100%", borderRadius: "16px", padding: "14px",
              fontSize: "14px", lineHeight: 1.7, resize: "none", minHeight: "140px",
              outline: "none", boxSizing: "border-box",
              background: t.dark ? "#0f0a1e" : "rgba(245,240,255,0.6)",
              border: `1px solid ${t.inputBorder}`,
              color: t.text, transition: "border 0.2s",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: t.muted, margin: 0 }}>
              {text.length > 0 ? `${text.length} characters` : "Start writing..."}
            </p>
            {saved && <p style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e", margin: 0 }}>✓ Entry saved with AI analysis!</p>}
          </div>

          <button onClick={save} disabled={saving || !text.trim()} style={{
            width: "100%", padding: "14px", borderRadius: "16px", border: "none",
            background: saving || !text.trim() ? "#c4b5fd" : "linear-gradient(135deg, #8b5cf6, #a78bfa)",
            color: "white", fontSize: "15px", fontWeight: 700,
            cursor: saving || !text.trim() ? "not-allowed" : "pointer",
            boxShadow: text.trim() ? "0 8px 24px rgba(139,92,246,0.35)" : "none",
          }}>
            {saving ? "Saving & analyzing sentiment..." : "Save Entry →"}
          </button>
        </div>

        {/* Entries list */}
        {entries.length > 0 ? (
          <div>
            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ flex: 1, height: "1px", background: t.border }} />
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a78bfa", margin: 0 }}>
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
              <div style={{ flex: 1, height: "1px", background: t.border }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[...entries].reverse().map(e => (
                <div key={e.id} style={{
                  borderRadius: "20px", padding: "16px 16px 16px 24px",
                  position: "relative", overflow: "hidden",
                  background: t.dark ? t.card : "rgba(255,255,255,0.80)",
                  border: `1px solid ${t.border}`,
                  boxShadow: t.dark ? "none" : "0 2px 12px rgba(139,92,246,0.06)",
                }}>
                  {/* Left accent bar */}
                  <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", borderRadius: "999px", background: "linear-gradient(to bottom, #8b5cf6, #c4b5fd)" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: t.muted, margin: 0 }}>
                      📅 {formatDate(e.created_at)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <SentimentBadge label={e.sentiment_label} score={e.sentiment_score} />
                      <p style={{ fontSize: "12px", color: t.muted, margin: 0 }}>{getTimeAgo(e.created_at)}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: "14px", lineHeight: 1.7, color: t.text, margin: 0 }}>{e.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", borderRadius: "20px", background: t.dark ? t.card : "rgba(255,255,255,0.5)", border: `1px dashed ${t.border}` }}>
            <p style={{ fontSize: "40px", marginBottom: "12px" }}>📭</p>
            <p style={{ fontWeight: 600, color: t.text, margin: "0 0 4px" }}>No entries yet</p>
            <p style={{ fontSize: "13px", color: t.muted, margin: 0 }}>Write your first entry above — AI will analyze your mood!</p>
          </div>
        )}
      </div>
    </div>
  );
}
