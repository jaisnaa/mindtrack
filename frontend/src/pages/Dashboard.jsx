import { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { useTheme } from "../App";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
const token = () => localStorage.getItem("token");

const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
const formatDateTime = (d) => new Date(d).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const SentimentBadge = ({ label, score }) => {
  const cfg = {
    Positive: { bg: "#dcfce7", color: "#16a34a", emoji: "😊" },
    Negative: { bg: "#fee2e2", color: "#dc2626", emoji: "😞" },
    Neutral:  { bg: "#ede9fe", color: "#7c3aed", emoji: "😐" },
  }[label] || { bg: "#ede9fe", color: "#7c3aed", emoji: "😐" };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: "999px", padding: "3px 12px", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {cfg.emoji} {label} {score}%
    </span>
  );
};

const Achievement = ({ emoji, title, desc, unlocked, dark }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: "14px",
    padding: "14px 16px", borderRadius: "14px",
    background: unlocked ? (dark ? "#2d1f5e" : "#ede9fe") : (dark ? "#1a1035" : "#f9fafb"),
    border: `1px solid ${unlocked ? (dark ? "#4c1d95" : "#ddd6fe") : (dark ? "#2d1f5e" : "#e5e7eb")}`,
    opacity: unlocked ? 1 : 0.5,
  }}>
    <span style={{ fontSize: "26px", filter: unlocked ? "none" : "grayscale(1)" }}>{emoji}</span>
    <div>
      <div style={{ fontWeight: 700, fontSize: "13px", color: unlocked ? (dark ? "#e9d5ff" : "#4c1d95") : "#9ca3af" }}>{title}</div>
      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{desc}</div>
    </div>
    {unlocked && <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 700, color: "#8b5cf6", background: dark ? "#1a1035" : "#f5f3ff", padding: "3px 10px", borderRadius: "999px" }}>Unlocked ✓</span>}
  </div>
);

const CustomTooltip = ({ active, payload, label, dark }) => {
  if (active && payload && payload.length) return (
    <div style={{ background: dark ? "#1a1035" : "white", border: `1px solid ${dark ? "#2d1f5e" : "#ede9fe"}`, borderRadius: "12px", padding: "12px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: dark ? "#e9d5ff" : "#4c1d95", fontSize: "13px" }}>{label}</p>
      {payload.map((p) => <p key={p.name} style={{ margin: "2px 0", color: p.color, fontSize: "12px" }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
  return null;
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: "12px", fontWeight: 700 }}>{`${(percent * 100).toFixed(0)}%`}</text>;
};

// ── PDF Generator ─────────────────────────────────────────────────────────────
function generatePDF({ stats, entries, checkins }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 18;
  let y = 0;

  const month = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const newPage = () => { doc.addPage(); y = 20; };
  const checkPage = (need = 20) => { if (y + need > 275) newPage(); };

  const rect = (x, ry, w, h, r = 4, fill = "#f5f3ff") => {
    doc.setFillColor(fill);
    doc.roundedRect(x, ry, w, h, r, r, "F");
  };

  const text = (str, x, ty, size = 11, color = "#1a1035", style = "normal", align = "left") => {
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.setFont("helvetica", style);
    doc.text(String(str), x, ty, { align });
  };

  const line = (lx1, ly1, lx2, ly2, color = "#ede9fe", lw = 0.3) => {
    doc.setDrawColor(color);
    doc.setLineWidth(lw);
    doc.line(lx1, ly1, lx2, ly2);
  };

  // ── COVER ────────────────────────────────────────────────────────────────────
  doc.setFillColor("#7c3aed");
  doc.rect(0, 0, W, 60, "F");
  doc.setFillColor("#a78bfa");
  doc.rect(0, 55, W, 6, "F");

  text("MindTrack", W / 2, 26, 28, "#ffffff", "bold", "center");
  text("Monthly Wellness Report", W / 2, 36, 14, "#ddd6fe", "normal", "center");
  text(month, W / 2, 46, 11, "#c4b5fd", "normal", "center");

  y = 75;

  // Summary stat boxes
  const statsRow = [
    { label: "Current Streak",  value: `${stats?.streak ?? 0} days`,  color: "#f59e0b" },
    { label: "Journal Entries", value: stats?.total_entries ?? 0,      color: "#8b5cf6" },
    { label: "Check-ins",       value: stats?.total_checkins ?? 0,     color: "#06b6d4" },
    { label: "Avg Mood Score",  value: stats?.avg_sentiment ?? "N/A",  color: "#22c55e" },
  ];
  const bw = (W - margin * 2 - 12) / 4;
  statsRow.forEach((s, i) => {
    const bx = margin + i * (bw + 4);
    rect(bx, y, bw, 26, 4, "#f5f3ff");
    doc.setFillColor(s.color);
    doc.rect(bx, y, bw, 3, "F");
    text(String(s.value), bx + bw / 2, y + 13, 14, s.color, "bold", "center");
    text(s.label, bx + bw / 2, y + 20, 7, "#7c6faa", "normal", "center");
  });

  y += 36;

  // ── MOOD AVERAGES ─────────────────────────────────────────────────────────
  text("Wellness Averages", margin, y, 13, "#3b1f6e", "bold");
  line(margin, y + 2, W - margin, y + 2);
  y += 10;

  const avgSleep  = checkins.length ? (checkins.reduce((a, c) => a + c.sleep_score,  0) / checkins.length).toFixed(1) : "—";
  const avgStress = checkins.length ? (checkins.reduce((a, c) => a + c.stress_score, 0) / checkins.length).toFixed(1) : "—";
  const avgEnergy = checkins.length ? (checkins.reduce((a, c) => a + c.energy_score, 0) / checkins.length).toFixed(1) : "—";

  const avgRow = [
    { label: "Avg Sleep",  value: avgSleep,  color: "#8b5cf6", bar: (avgSleep / 10) },
    { label: "Avg Stress", value: avgStress, color: "#ef4444", bar: (avgStress / 10) },
    { label: "Avg Energy", value: avgEnergy, color: "#f59e0b", bar: (avgEnergy / 10) },
  ];
  const abw = (W - margin * 2 - 8) / 3;
  avgRow.forEach((a, i) => {
    const ax = margin + i * (abw + 4);
    rect(ax, y, abw, 22, 4, "#faf5ff");
    text(a.label, ax + 6, y + 8, 8, "#7c6faa", "normal");
    text(String(a.value) + "/10", ax + 6, y + 16, 12, a.color, "bold");
    const blen = (abw - 12) * (isNaN(a.bar) ? 0 : a.bar);
    doc.setFillColor("#ede9fe");
    doc.roundedRect(ax + 6, y + 18, abw - 12, 2, 1, 1, "F");
    doc.setFillColor(a.color);
    doc.roundedRect(ax + 6, y + 18, blen, 2, 1, 1, "F");
  });
  y += 32;

  // ── MOOD SENTIMENT BREAKDOWN ──────────────────────────────────────────────
  checkPage(40);
  text("Mood Sentiment Breakdown", margin, y, 13, "#3b1f6e", "bold");
  line(margin, y + 2, W - margin, y + 2);
  y += 10;

  const pos = entries.filter(e => e.sentiment_label === "Positive").length;
  const neg = entries.filter(e => e.sentiment_label === "Negative").length;
  const neu = entries.filter(e => e.sentiment_label === "Neutral").length;
  const total = entries.length || 1;

  const sentRow = [
    { label: "Positive", count: pos, color: "#22c55e", pct: Math.round(pos / total * 100) },
    { label: "Neutral",  count: neu, color: "#a78bfa", pct: Math.round(neu / total * 100) },
    { label: "Negative", count: neg, color: "#ef4444", pct: Math.round(neg / total * 100) },
  ];

  const sbw = (W - margin * 2 - 8) / 3;
  sentRow.forEach((s, i) => {
    const sx = margin + i * (sbw + 4);
    rect(sx, y, sbw, 22, 4, "#fafafa");
    doc.setFillColor(s.color);
    doc.rect(sx, y, sbw, 3, "F");
    text(`${s.pct}%`, sx + sbw / 2, y + 12, 16, s.color, "bold", "center");
    text(`${s.label} (${s.count})`, sx + sbw / 2, y + 19, 8, "#7c6faa", "normal", "center");
  });
  y += 32;

  // ── MOOD TREND (text table) ───────────────────────────────────────────────
  checkPage(50);
  text("Recent Mood Trend", margin, y, 13, "#3b1f6e", "bold");
  line(margin, y + 2, W - margin, y + 2);
  y += 10;

  const recentMood = [...entries]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-10);

  if (recentMood.length > 0) {
    rect(margin, y, W - margin * 2, 8, 2, "#ede9fe");
    text("Date",      margin + 4,   y + 5.5, 8, "#4c1d95", "bold");
    text("Sentiment", margin + 50,  y + 5.5, 8, "#4c1d95", "bold");
    text("Score",     margin + 100, y + 5.5, 8, "#4c1d95", "bold");
    text("Preview",   margin + 130, y + 5.5, 8, "#4c1d95", "bold");
    y += 10;

    recentMood.forEach((e, i) => {
      checkPage(10);
      if (i % 2 === 0) rect(margin, y - 1, W - margin * 2, 8, 1, "#faf5ff");
      const preview = (e.content || "").slice(0, 30) + (e.content?.length > 30 ? "..." : "");
      const sColor = e.sentiment_label === "Positive" ? "#16a34a" : e.sentiment_label === "Negative" ? "#dc2626" : "#7c3aed";
      text(formatDate(e.created_at), margin + 4,   y + 5, 8, "#3b1f6e");
      text(e.sentiment_label || "—", margin + 50,  y + 5, 8, sColor, "bold");
      text(`${e.sentiment_score}%`,  margin + 100, y + 5, 8, "#3b1f6e");
      text(preview,                  margin + 130, y + 5, 7, "#7c6faa");
      y += 8;
    });
  } else {
    text("No journal entries yet.", margin, y + 6, 10, "#9ca3af", "normal");
    y += 14;
  }

  // ── CHECK-IN HISTORY ──────────────────────────────────────────────────────
  y += 6;
  checkPage(50);
  text("Check-in History (Last 10)", margin, y, 13, "#3b1f6e", "bold");
  line(margin, y + 2, W - margin, y + 2);
  y += 10;

  const recentCI = [...checkins]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  if (recentCI.length > 0) {
    rect(margin, y, W - margin * 2, 8, 2, "#ede9fe");
    text("Date",   margin + 4,   y + 5.5, 8, "#4c1d95", "bold");
    text("Sleep",  margin + 60,  y + 5.5, 8, "#4c1d95", "bold");
    text("Stress", margin + 100, y + 5.5, 8, "#4c1d95", "bold");
    text("Energy", margin + 140, y + 5.5, 8, "#4c1d95", "bold");
    y += 10;

    recentCI.forEach((c, i) => {
      checkPage(10);
      if (i % 2 === 0) rect(margin, y - 1, W - margin * 2, 8, 1, "#faf5ff");
      text(formatDateTime(c.date), margin + 4,   y + 5, 8, "#3b1f6e");
      text(`${c.sleep_score}/10`,  margin + 60,  y + 5, 8, "#8b5cf6", "bold");
      text(`${c.stress_score}/10`, margin + 100, y + 5, 8, "#ef4444", "bold");
      text(`${c.energy_score}/10`, margin + 140, y + 5, 8, "#f59e0b", "bold");
      y += 8;
    });
  } else {
    text("No check-ins yet.", margin, y + 6, 10, "#9ca3af");
    y += 14;
  }

  // ── ACHIEVEMENTS ─────────────────────────────────────────────────────────
  y += 8;
  checkPage(50);
  text("Achievements Unlocked", margin, y, 13, "#3b1f6e", "bold");
  line(margin, y + 2, W - margin, y + 2);
  y += 10;

  const allAchievements = [
    { title: "First Entry",    unlocked: (stats?.total_entries  ?? 0) >= 1  },
    { title: "First Check-in", unlocked: (stats?.total_checkins ?? 0) >= 1  },
    { title: "3-Day Streak",   unlocked: (stats?.streak         ?? 0) >= 3  },
    { title: "7-Day Streak",   unlocked: (stats?.streak         ?? 0) >= 7  },
    { title: "10 Entries",     unlocked: (stats?.total_entries  ?? 0) >= 10 },
    { title: "20 Entries",     unlocked: (stats?.total_entries  ?? 0) >= 20 },
  ];

  const unlocked = allAchievements.filter(a => a.unlocked);
  if (unlocked.length > 0) {
    unlocked.forEach((a, i) => {
      if (i % 3 === 0 && i > 0) y += 14;
      const ax = margin + (i % 3) * 62;
      checkPage(14);
      rect(ax, y, 58, 12, 3, "#ede9fe");
      doc.setFillColor("#8b5cf6");
      doc.circle(ax + 8, y + 6, 3, "F");
      text(a.title, ax + 14, y + 7, 8, "#4c1d95", "bold");
    });
    y += 20;
  } else {
    text("No achievements yet — keep going!", margin, y + 6, 10, "#9ca3af");
    y += 14;
  }

  // ── FOOTER on every page ──────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor("#7c3aed");
    doc.rect(0, 287, W, 10, "F");
    text("MindTrack — Your Wellness Journey", margin, 293, 7, "#ddd6fe");
    text(`Page ${p} of ${pageCount}`, W - margin, 293, 7, "#ddd6fe", "normal", "right");
    text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, W / 2, 293, 7, "#c4b5fd", "normal", "center");
  }

  doc.save(`MindTrack_Report_${month.replace(" ", "_")}.pdf`);
}

// ── Dashboard Component ───────────────────────────────────────────────────────
export default function Dashboard() {
  const t = useTheme();
  const [stats, setStats]       = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [entries, setEntries]   = useState([]);
  const [quote, setQuote]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token()}` };
    Promise.all([
      axios.get(`${API}/dashboard/stats`,    { headers: h }),
      axios.get(`${API}/dashboard/checkins`, { headers: h }),
      axios.get(`${API}/entries`,            { headers: h }),
      axios.get(`${API}/dashboard/quote`,    { headers: h }),
    ]).then(([s, c, e, q]) => {
      setStats(s.data);
      setCheckins(c.data);
      setEntries(e.data);
      setQuote(q.data);
    }).catch(() => setError("Could not load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const handlePDF = () => {
    setPdfLoading(true);
    try {
      generatePDF({ stats, entries, checkins });
    } catch (err) {
      console.error("PDF error:", err);
      alert("Could not generate PDF. Please try again.");
    }
    setPdfLoading(false);
  };

  const moodData = [...entries]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-14)
    .map(e => ({ date: formatDate(e.created_at), Score: e.sentiment_score }));

  const ciData = [...checkins]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14)
    .map(c => ({ date: formatDate(c.date), Sleep: c.sleep_score, Stress: c.stress_score, Energy: c.energy_score }));

  const pieData = [
    { name: "Positive", value: entries.filter(e => e.sentiment_label === "Positive").length, color: "#22c55e" },
    { name: "Negative", value: entries.filter(e => e.sentiment_label === "Negative").length, color: "#ef4444" },
    { name: "Neutral",  value: entries.filter(e => e.sentiment_label === "Neutral").length,  color: "#a78bfa" },
  ].filter(d => d.value > 0);

  const latest = [...entries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const weekPct = Math.min(100, Math.round(((stats?.week_checkins ?? 0) / 5) * 100));

  const achievements = [
    { emoji: "📝", title: "First Entry",    desc: "Write your first journal entry",     unlocked: (stats?.total_entries  ?? 0) >= 1  },
    { emoji: "✅", title: "First Check-in", desc: "Complete your first daily check-in", unlocked: (stats?.total_checkins ?? 0) >= 1  },
    { emoji: "🔥", title: "3-Day Streak",   desc: "Check in 3 days in a row",           unlocked: (stats?.streak         ?? 0) >= 3  },
    { emoji: "🏆", title: "7-Day Streak",   desc: "Check in 7 days in a row",           unlocked: (stats?.streak         ?? 0) >= 7  },
    { emoji: "📓", title: "10 Entries",     desc: "Write 10 journal entries",           unlocked: (stats?.total_entries  ?? 0) >= 10 },
    { emoji: "🌟", title: "20 Entries",     desc: "Write 20 journal entries",           unlocked: (stats?.total_entries  ?? 0) >= 20 },
  ];

  const card = {
    background: t.card,
    borderRadius: "20px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
    border: `1px solid ${t.border}`,
    padding: "24px",
  };

  if (loading) return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "44px" }}>🔮</div>
        <p style={{ color: "#a78bfa" }}>Loading your dashboard…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>{error}</div>
  );

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 20px", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header with PDF button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: t.text, margin: 0 }}>Your Wellness Dashboard 🌿</h1>
          <p style={{ color: t.muted, marginTop: "6px", fontSize: "14px" }}>A snapshot of how you've been doing lately.</p>
        </div>
        <button onClick={handlePDF} disabled={pdfLoading} style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 20px", borderRadius: "14px", border: "none",
          background: pdfLoading ? "#c4b5fd" : "linear-gradient(135deg, #7c3aed, #a78bfa)",
          color: "white", fontSize: "14px", fontWeight: 700,
          cursor: pdfLoading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
          transition: "opacity 0.2s", opacity: pdfLoading ? 0.7 : 1,
        }}>
          {pdfLoading ? "⏳ Generating…" : "📄 Download PDF Report"}
        </button>
      </div>

      {/* Quote */}
      {quote && (
        <div style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", borderRadius: "20px", padding: "22px 28px", marginBottom: "24px", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>💡 Daily Inspiration</div>
          <div style={{ fontSize: "16px", color: "white", fontWeight: 500, lineHeight: 1.6, fontStyle: "italic" }}>"{quote.quote}"</div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", marginTop: "8px" }}>— {quote.author}</div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { emoji: "🔥", label: "CURRENT STREAK",  value: `${stats?.streak ?? 0} days`, sub: "Keep it going!",  accent: "#f59e0b" },
          { emoji: "📓", label: "JOURNAL ENTRIES",  value: stats?.total_entries ?? 0,    sub: "Total written",   accent: "#8b5cf6" },
          { emoji: "✅", label: "CHECK-INS",         value: stats?.total_checkins ?? 0,   sub: "Total logged",    accent: "#06b6d4" },
          { emoji: "😊", label: "AVG MOOD",          value: stats?.avg_sentiment ?? "—",  sub: "Last 7 days",     accent: "#22c55e" },
        ].map(({ emoji, label, value, sub, accent }) => (
          <div key={label} style={{ ...card, borderTop: `4px solid ${accent}`, padding: "22px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "26px" }}>{emoji}</span>
            <span style={{ fontSize: "11px", color: t.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
            <span style={{ fontSize: "28px", fontWeight: 800, color: t.text, lineHeight: 1.1 }}>{value}</span>
            <span style={{ fontSize: "12px", color: "#a78bfa" }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* Weekly goal */}
      <div style={{ ...card, marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: t.text, margin: "0 0 16px" }}>🎯 Weekly Check-in Goal</h2>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "14px", color: t.muted }}>{stats?.week_checkins ?? 0} of 5 check-ins this week</span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#8b5cf6" }}>{weekPct}%</span>
        </div>
        <div style={{ background: t.border, borderRadius: "999px", height: "12px", overflow: "hidden" }}>
          <div style={{ width: `${weekPct}%`, height: "100%", background: "linear-gradient(90deg, #8b5cf6, #a78bfa)", borderRadius: "999px", transition: "width 0.6s ease" }} />
        </div>
        <div style={{ marginTop: "10px", fontSize: "13px", color: "#a78bfa" }}>
          {weekPct >= 100 ? "🎉 Goal complete! Amazing work!" : weekPct >= 60 ? "💪 Great progress — almost there!" : "🌱 Keep going — every check-in counts!"}
        </div>
      </div>

      {/* Mood chart */}
      {moodData.length > 0 && (
        <div style={{ ...card, marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: t.text, margin: "0 0 18px" }}>📈 Mood Sentiment — Last 14 Entries</h2>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.muted }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: t.muted }} unit="%" />
              <Tooltip content={<CustomTooltip dark={t.dark} />} />
              <Line type="monotone" dataKey="Score" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: "#8b5cf6" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sleep/Stress/Energy + Pie side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        {ciData.length > 0 && (
          <div style={card}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: t.text, margin: "0 0 18px" }}>🛌 Sleep · Stress · Energy</h2>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={ciData}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.muted }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: t.muted }} />
                <Tooltip content={<CustomTooltip dark={t.dark} />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="Sleep"  stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Stress" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Energy" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {pieData.length > 0 && (
          <div style={card}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: t.text, margin: "0 0 18px" }}>📊 Mood Breakdown</h2>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false} label={PieLabel}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} entries`, n]} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Latest journal entry */}
      {latest && (
        <div style={{ ...card, marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: t.text, margin: "0 0 16px" }}>📝 Latest Journal Entry</h2>
          <div style={{ background: t.bg, borderRadius: "14px", padding: "16px 18px", border: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#a78bfa", fontWeight: 500 }}>📅 {formatDateTime(latest.created_at)}</span>
              <SentimentBadge label={latest.sentiment_label} score={latest.sentiment_score} />
            </div>
            <p style={{ margin: 0, color: t.text, fontSize: "14px", lineHeight: 1.7 }}>
              {latest.content.length > 200 ? latest.content.slice(0, 200) + "…" : latest.content}
            </p>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div style={{ ...card, marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: t.text, margin: "0 0 16px" }}>🏆 Achievements</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
          {achievements.map(a => <Achievement key={a.title} {...a} dark={t.dark} />)}
        </div>
      </div>

      {/* Check-in history */}
      {checkins.length > 0 && (
        <div style={card}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: t.text, margin: "0 0 16px" }}>📅 Check-in History</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...checkins].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: "14px", background: t.bg, border: `1px solid ${t.border}`, flexWrap: "wrap", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "#8b5cf6", fontWeight: 600 }}>📅 {formatDateTime(c.date)}</span>
                <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: t.text }}>
                  <span>🛌 <strong style={{ color: "#8b5cf6" }}>{c.sleep_score}/10</strong></span>
                  <span>😤 <strong style={{ color: "#ef4444" }}>{c.stress_score}/10</strong></span>
                  <span>⚡ <strong style={{ color: "#f59e0b" }}>{c.energy_score}/10</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
