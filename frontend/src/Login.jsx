// useState hook for managing component state (form inputs)
import { useState } from "react";
import { authAPI } from "./api";

export default function Login({ setToken }) {
  // State for username input field
  const [username, setUsername] = useState("");

  // State for password input field
  const [password, setPassword] = useState("");

  // State for loading and feedback
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // -------------------------
  // REGISTER FUNCTION
  // -------------------------
  const register = async () => {
    if (!username.trim() || !password.trim()) {
      setMessageType("error");
      setMessage("⚠️ Please fill in all fields");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");
      
      await authAPI.post("/register", {
        username,
        password
      });

      setMessageType("success");
      setMessage("✅ Registration successful! You can now login.");
      setUsername("");
      setPassword("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.log("Registration Error:", error.response?.data);
      setMessageType("error");
      setMessage("❌ Registration failed. Username may already exist.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // LOGIN FUNCTION - FIXED!
  // -------------------------
  const login = async () => {
    if (!username.trim() || !password.trim()) {
      setMessageType("error");
      setMessage("⚠️ Please fill in all fields");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      // Send POST request to /login endpoint
      const res = await authAPI.post("/login", {
        username,
        password
      });

      // ✅ IMPORTANT: Backend returns "access_token", NOT "token"
      console.log("✅ Full response:", res.data);
      console.log("🔑 Token:", res.data.access_token);

      const token = res.data.access_token;  // ← THIS IS THE FIX!

      if (!token) {
        console.log("❌ No token received!");
        setMessageType("error");
        setMessage("❌ No token received from server");
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      // Store token in localStorage
      localStorage.setItem("token", token);
      console.log("💾 Token saved to localStorage");

      // Update parent component state
      setToken(token);
      console.log("🔄 Token set in React state");

      setMessageType("success");
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => setMessage(""), 2000);

    } catch (error) {
      console.log("❌ Login Error:", error.response?.data);
      console.log("❌ Status:", error.response?.status);
      
      setMessageType("error");
      setMessage("❌ Login failed. Invalid credentials.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
      padding: "20px",
      width: "100%"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "40px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)",
        transition: "transform 0.2s"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "12px"
          }}>🔐</div>
          <h2 style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#0f172a",
            margin: 0,
            letterSpacing: "-0.025em"
          }}>Welcome Back</h2>
          <p style={{
            margin: "6px 0 0 0",
            color: "#64748b",
            fontSize: "15px"
          }}>Sign in to continue your studies</p>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "10px",
            backgroundColor: messageType === "error" ? "#fef2f2" : "#f0fdf4",
            color: messageType === "error" ? "#dc2626" : "#16a34a",
            border: `1px solid ${messageType === "error" ? "#fecaca" : "#bbf7d0"}`,
            fontSize: "14px",
            fontWeight: "500",
            textAlign: "center",
            animation: "fadeIn 0.3s ease-in"
          }}>
            {message}
          </div>
        )}

        {/* Form */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {/* Username input field */}
          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#0f172a",
              marginBottom: "6px"
            }}>
              Username
            </label>
            <input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && login()}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "15px",
                borderRadius: "10px",
                border: "2px solid #e2e8f0",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                backgroundColor: "#fafbfc",
                boxSizing: "border-box",
                color: "#000000"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password input field */}
          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#0f172a",
              marginBottom: "6px"
            }}>
              Password
            </label>
            <input
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && login()}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "15px",
                borderRadius: "10px",
                border: "2px solid #e2e8f0",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                backgroundColor: "#fafbfc",
                boxSizing: "border-box",
                color: "#000000"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            gap: "12px",
            marginTop: "8px"
          }}>
            {/* Login button */}
            <button
              onClick={login}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: "600",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#3b82f6",
                color: "white",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = "#2563eb")}
              onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = "#3b82f6")}
            >
              {isLoading ? "⏳ Processing..." : "Sign In"}
            </button>

            {/* Register button */}
            <button
              onClick={register}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: "600",
                borderRadius: "10px",
                border: "2px solid #e2e8f0",
                backgroundColor: "white",
                color: "#0f172a",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = "white")}
            >
              {isLoading ? "⏳..." : "Create Account"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1px solid #e2e8f0",
          textAlign: "center",
          fontSize: "13px",
          color: "#94a3b8"
        }}>
          <span>Demo credentials: </span>
          <span style={{ fontWeight: "500", color: "#64748b" }}>user / pass</span>
        </div>

        {/* Animation styles */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Force black text in all input fields */
          input,
          input[type="text"],
          input[type="password"],
          input[type="email"],
          input[type="number"],
          textarea,
          select {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }

          input::placeholder,
          textarea::placeholder {
            color: #94a3b8 !important;
            -webkit-text-fill-color: #94a3b8 !important;
          }

          input:focus,
          input:active,
          input:not(:placeholder-shown) {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
        `}</style>
      </div>
    </div>
  );
}