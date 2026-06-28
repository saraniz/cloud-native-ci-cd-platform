import { useState } from "react";
import { studyAPI } from "./api";

export default function Dashboard({ token }) {
  const [subject, setSubject] = useState("");
  const [sessions, setSessions] = useState([]);

  const startSession = async () => {
    await studyAPI.post(
      "/sessions/start",
      { subject },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  };

  const endSession = async (id) => {
    await studyAPI.put(
      `/sessions/end/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  };

  const loadSessions = async () => {
    const res = await studyAPI.get("/sessions", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setSessions(res.data);
  };

  return (
    <div>
      <h2>Study Dashboard</h2>

      <input
        placeholder="subject"
        onChange={(e) => setSubject(e.target.value)}
      />

      <button onClick={startSession}>Start Session</button>
      <button onClick={loadSessions}>Load Sessions</button>

      <h3>Sessions</h3>

      <ul>
        {sessions.map((s, index) => (
          <li key={index}>
            {s.subject} - {s.duration} min
          </li>
        ))}
      </ul>
    </div>
  );
}