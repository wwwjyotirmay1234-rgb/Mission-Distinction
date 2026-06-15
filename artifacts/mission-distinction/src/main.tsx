import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";

setAuthTokenGetter(async () => {
  const token = localStorage.getItem("mission_token");
  if (!token) return null;
  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));
    const expiresAt = (payload.exp as number) * 1000;
    if (expiresAt - Date.now() < 60 * 1000) {
      const refreshToken = localStorage.getItem("mission_refresh_token");
      if (!refreshToken) return null;
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("mission_token", data.token);
        if (data.refreshToken) localStorage.setItem("mission_refresh_token", data.refreshToken);
        if (data.user) localStorage.setItem("mission_user", JSON.stringify(data.user));
        return data.token as string;
      }
      return null;
    }
  } catch {
  }
  return token;
});

createRoot(document.getElementById("root")!).render(<App />);
