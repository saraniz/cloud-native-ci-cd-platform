import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

export default function App() {
  const [token, setToken] = useState("");

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f8fafc"
    }}>
      {!token ? (
        <Login setToken={setToken} />
      ) : (
        <Dashboard token={token} />
      )}
    </div>
  );
}