import { useEffect, useState } from "react";
import type { HealthResponse } from "@ttapp/shared";

// Placeholder home screen: proves the frontend can reach the backend using a shared type.
export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main>
      <h1>Theta Tau Hub</h1>
      {health && <p>Backend is running (checked at {health.time})</p>}
      {error && <p>Can't reach the backend: {error}</p>}
      {!health && !error && <p>Checking backend…</p>}
    </main>
  );
}
