// useState hook for managing component state (form inputs)
import { useState } from "react";

// Axios instance configured for auth backend (port 5000)
import { authAPI } from "./api";


export default function Login({ setToken }) {

  // State for username input field
  const [username, setUsername] = useState("");

  // State for password input field
  const [password, setPassword] = useState("");


  // -------------------------
  // REGISTER FUNCTION
  // -------------------------
  const register = async () => {

    // Send POST request to /register endpoint
    // authAPI already has baseURL: http://localhost:5000
    await authAPI.post("/register", {
      username,
      password
    });
  };


  // -------------------------
  // LOGIN FUNCTION
  // -------------------------
  const login = async () => {

    // Send POST request to /login endpoint
    const res = await authAPI.post("/login", {
      username,
      password
    });

    // Extract JWT token from backend response
    setToken(res.data.token);
  };


  return (
    <div>

      <h2>Auth Service</h2>

      {/* Username input field */}
      <input
        placeholder="username"

        // onChange runs every time user types
        // e.target.value = current input value
        onChange={(e) => setUsername(e.target.value)}
      />

      {/* Password input field */}
      <input
        placeholder="password"
        type="password"

        // Update password state on typing
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Register button triggers register function */}
      <button onClick={register}>Register</button>

      {/* Login button triggers login function */}
      <button onClick={login}>Login</button>

    </div>
  );
}