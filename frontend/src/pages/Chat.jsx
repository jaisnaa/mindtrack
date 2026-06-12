import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../App";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
const token = () => localStorage.getItem("token");

export default function Chat() {
  const t = useTheme();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your MindTrack wellness companion 💜 How are you feeling today? You can talk to me about anything on your mind."
    }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const res = await axios.post(
        `${API}/chat`,
        { message: input, history: history.slice(0, -1) },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment 💜"
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: t.dark
        ? t.bg
        : "linear-gradient(135deg, #f5f0ff 0%, #ede9fe 50%, #f3f0ff 100%)",
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Chat header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        padding: "14px 20px", textAlign: "center",
        background: t.navBg,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${t.navBorder}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🧠</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: "14px", color: t.text, margin: 0 }}>MindTrack Companion</p>
            <p style={{ fontSize: "12px", color: "#a78bfa", margin: 0 }}>● Always here for you</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px", maxWidth: "620px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "16px" }}>

            {msg.role === "assistant" && (
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginRight: "10px", flexShrink: 0, marginTop: "4px",
                background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
              }}>
                <span style={{ fontSize: "14px" }}>🧠</span>
              </div>
            )}

            <div style={{
              maxWidth: "75%", padding: "12px 16px",
              borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
              fontSize: "14px", lineHeight: 1.6,
              ...(msg.role === "user" ? {
                background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
                color: "white",
                boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
              } : {
                background: t.dark ? t.card : "rgba(255,255,255,0.9)",
                color: t.text,
                border: `1px solid ${t.border}`,
                boxShadow: t.dark ? "none" : "0 2px 8px rgba(139,92,246,0.08)",
              }),
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", flexShrink: 0, background: "linear-gradient(135deg, #8b5cf6, #a78bfa)" }}>
              <span style={{ fontSize: "14px" }}>🧠</span>
            </div>
            <div style={{ padding: "12px 16px", borderRadius: "20px 20px 20px 4px", fontSize: "14px", background: t.dark ? t.card : "rgba(255,255,255,0.9)", border: `1px solid ${t.border}`, color: "#a78bfa" }}>
              typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: "sticky", bottom: 0,
        padding: "14px 16px",
        background: t.navBg,
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${t.navBorder}`,
      }}>
        <div style={{ maxWidth: "620px", margin: "0 auto", display: "flex", gap: "12px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="How are you feeling? Type here... 💭"
            style={{
              flex: 1, borderRadius: "16px", padding: "12px 16px", fontSize: "14px",
              outline: "none",
              background: t.dark ? "#1a1035" : "rgba(245,240,255,0.8)",
              border: `1px solid ${t.inputBorder}`,
              color: t.text,
            }}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            padding: "12px 20px", borderRadius: "16px", border: "none",
            background: loading || !input.trim() ? "#c4b5fd" : "linear-gradient(135deg, #8b5cf6, #a78bfa)",
            color: "white", fontSize: "14px", fontWeight: 700,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            boxShadow: input.trim() ? "0 4px 12px rgba(139,92,246,0.3)" : "none",
            whiteSpace: "nowrap",
          }}>
            Send
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: t.muted, marginTop: "8px" }}>
          Not a replacement for professional help 💜
        </p>
      </div>
    </div>
  );
}
