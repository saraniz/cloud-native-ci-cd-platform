import { useState, useEffect } from "react";
import { studyAPI } from "./api";

export default function Dashboard({ token }) {
  const [subject, setSubject] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Load sessions automatically when component mounts
  useEffect(() => {
    loadSessions();
  }, []);

  // Find the active session (one where end_time is not set/empty)
  const activeSession = sessions.find(s => !s.end_time || s.end_time === "");

  // Active Timer Effect
  useEffect(() => {
    let interval = null;
    if (activeSession) {
      const calculateElapsed = () => {
        const start = new Date(activeSession.start_time);
        const diffMs = new Date() - start;
        return Math.max(0, Math.floor(diffMs / 1000));
      };

      setSecondsElapsed(calculateElapsed());

      interval = setInterval(() => {
        setSecondsElapsed(calculateElapsed());
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const res = await studyAPI.get("/sessions", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSessions(res.data);
    } catch (error) {
      setMessage("❌ Failed to load sessions");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    if (!subject.trim()) {
      setMessage("❌ Please enter a subject");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    try {
      setIsLoading(true);
      await studyAPI.post(
        "/sessions/start",
        { subject },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setMessage(`✅ Session started for "${subject}"`);
      setSubject("");
      await loadSessions(); // Automatically refresh list to update UI state
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("❌ Failed to start session");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async (id) => {
    try {
      setIsLoading(true);
      await studyAPI.put(
        `/sessions/end/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      await loadSessions();
      setMessage("✅ Session ended successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("❌ Failed to end session");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format seconds to HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":");
  };

  // Helper to format ISO timestamps nicely
  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + date.toLocaleDateString() + ')';
  };

  // Calculate statistics
  const completedSessions = sessions.filter(s => s.end_time && s.end_time !== "");
  const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  return (
    <div style={{
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "32px 24px",
      fontFamily: "Outfit, Inter, -apple-system, sans-serif",
      color: "#0f172a",
      minHeight: "100vh",
      boxSizing: "border-box"
    }}>
      {/* Top Banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "32px",
      }}>
        <div>
          <h1 style={{
            fontSize: "36px",
            fontWeight: "800",
            margin: 0,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.03em"
          }}>
            Amie Study Hub
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "15px" }}>
            Track and optimize your learning hours
          </p>
        </div>
        
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.reload();
          }}
          style={{
            padding: "8px 18px",
            fontSize: "14px",
            fontWeight: "600",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            backgroundColor: "white",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#fef2f2";
            e.target.style.color = "#dc2626";
            e.target.style.borderColor = "#fecaca";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.color = "#64748b";
            e.target.style.borderColor = "#e2e8f0";
          }}
        >
          Logout
        </button>
      </div>

      {/* Alert Banner */}
      {message && (
        <div style={{
          padding: "14px 20px",
          marginBottom: "28px",
          borderRadius: "12px",
          backgroundColor: message.includes("❌") ? "#fef2f2" : "#f0fdf4",
          color: message.includes("❌") ? "#dc2626" : "#15803d",
          border: `1px solid ${message.includes("❌") ? "#fecaca" : "#bbf7d0"}`,
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "center"
        }}>
          {message}
        </div>
      )}

      {/* Horizontal Active Session Control Bar */}
      <div style={{ marginBottom: "32px" }}>
        {activeSession ? (
          /* Active Ticking Timer Card - Horizontal Bar Layout */
          <div style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)",
            borderRadius: "20px",
            padding: "20px 32px",
            color: "white",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
            position: "relative"
          }}>
            {/* Subject details (Left) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "220px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#c084fc", letterSpacing: "0.1em" }}>
                CURRENTLY STUDYING
              </span>
              <h2 style={{ fontSize: "22px", fontWeight: "800", margin: 0, wordBreak: "break-word", color: "#ffffff" }}>
                📘 {activeSession.subject}
              </h2>
            </div>

            {/* Timer (Center) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}>
              <div style={{
                fontSize: "36px",
                fontWeight: "800",
                fontFamily: "monospace",
                background: "rgba(255, 255, 255, 0.08)",
                padding: "8px 24px",
                borderRadius: "12px",
                letterSpacing: "0.05em",
                color: "#e9d5ff",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
              }}>
                {formatTime(secondsElapsed)}
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span className="pulse-dot" style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  display: "inline-block"
                }} />
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#a7f3d0" }}>LIVE</span>
              </div>
            </div>

            {/* Stop button (Right) */}
            <div>
              <button
                onClick={() => endSession(activeSession.id)}
                disabled={isLoading}
                style={{
                  padding: "12px 28px",
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "white",
                  backgroundColor: "#dc2626",
                  border: "none",
                  borderRadius: "12px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.4)",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = "#b91c1c")}
                onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = "#dc2626")}
              >
                🛑 Stop Session
              </button>
            </div>
          </div>
        ) : (
          /* Start Study Session Form - Horizontal Bar Layout */
          <div style={{
            backgroundColor: "white",
            borderRadius: "20px",
            padding: "24px 32px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            border: "1px solid #f1f5f9",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px"
          }}>
            {/* Title Details (Left) */}
            <div style={{ minWidth: "220px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                Ready to study?
              </h3>
              <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                Start a session to log your progress
              </p>
            </div>

            {/* Input field & button (Right Side, Horizontal Row) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              justifyContent: "flex-end",
              minWidth: "280px"
            }}>
              <input
                placeholder="What subject are you studying?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && startSession()}
                disabled={isLoading}
                style={{
                  padding: "12px 18px",
                  fontSize: "14px",
                  borderRadius: "12px",
                  border: "2px solid #e2e8f0",
                  outline: "none",
                  transition: "border-color 0.2s",
                  backgroundColor: "#fafbfc",
                  color: "black",
                  flex: 1,
                  maxWidth: "400px"
                }}
                onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />

              <button
                onClick={startSession}
                disabled={isLoading}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: "700",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = "#4338ca")}
                onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = "#4f46e5")}
              >
                {isLoading ? "Starting..." : "🚀 Start Session"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "20px",
        marginBottom: "32px"
      }}>
        <div style={cardStyle}>
          <div style={iconContainerStyle("#e0e7ff", "#4f46e5")}>📅</div>
          <div>
            <div style={statLabelStyle}>Total Sessions</div>
            <div style={statValStyle}>{completedSessions.length}</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconContainerStyle("#fef3c7", "#d97706")}>⏱️</div>
          <div>
            <div style={statLabelStyle}>Working Minutes</div>
            <div style={statValStyle}>{totalMinutes} min</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconContainerStyle("#dcfce7", "#15803d")}>🎓</div>
          <div>
            <div style={statLabelStyle}>Total Working Hours</div>
            <div style={statValStyle}>{totalHours} hrs</div>
          </div>
        </div>
      </div>

      {/* History Section (Full Width Layout) */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        border: "1px solid #f1f5f9"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px"
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
            📋 Study History Log
          </h3>
          <button
            onClick={loadSessions}
            disabled={isLoading}
            style={{
              background: "none",
              border: "none",
              color: "#4f46e5",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              padding: 0
            }}
          >
            🔄 Refresh List
          </button>
        </div>

        {completedSessions.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "48px 20px",
            backgroundColor: "#f8fafc",
            borderRadius: "16px",
            color: "#94a3b8"
          }}>
            <div style={{ fontSize: "54px", marginBottom: "12px" }}>📚</div>
            <h4 style={{ margin: "0 0 6px 0", color: "#64748b", fontSize: "16px" }}>No sessions tracked yet</h4>
            <p style={{ margin: 0, fontSize: "13px" }}>Start your first study session to see your progress here.</p>
          </div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxHeight: "550px",
            overflowY: "auto",
            paddingRight: "4px"
          }}>
            {completedSessions.map((s, index) => (
              <div
                key={s.id || index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 24px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: "24px" }}>
                  <div style={{
                    fontWeight: "700",
                    fontSize: "16px",
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: "4px"
                  }}>
                    📘 {s.subject}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Session Period: {formatDateTime(s.start_time)} to {formatDateTime(s.end_time)}
                  </div>
                </div>

                <div style={{
                  backgroundColor: "#e0f2fe",
                  color: "#0369a1",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  whiteSpace: "nowrap"
                }}>
                  ⏱️ {s.duration > 0 ? `${s.duration} min` : "< 1 min"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embedded CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        .pulse-dot {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}

// Styling Constants
const cardStyle = {
  backgroundColor: "white",
  borderRadius: "16px",
  padding: "20px 24px",
  display: "flex",
  alignItems: "center",
  gap: "20px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  border: "1px solid #f1f5f9"
};

const iconContainerStyle = (bgColor, textColor) => ({
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  backgroundColor: bgColor,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  color: textColor
});

const statLabelStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#64748b",
  marginBottom: "4px"
};

const statValStyle = {
  fontSize: "24px",
  fontWeight: "800",
  color: "#0f172a",
  lineHeight: 1
};