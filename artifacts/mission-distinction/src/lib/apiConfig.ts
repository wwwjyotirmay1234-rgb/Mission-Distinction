/**
 * Central API configuration.
 *
 * On Vercel: set VITE_API_URL=https://your-railway-app.up.railway.app
 * On Replit (dev): leave unset — all calls go to the current origin via relative paths.
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/**
 * Socket.io server URL.
 * undefined = socket.io-client connects to the current origin (correct for Replit/dev).
 * A string = connects cross-origin to Railway.
 */
export const SOCKET_SERVER: string | undefined = API_BASE || undefined;

/**
 * Socket.io mount path.
 * When connecting cross-origin, skip the Vite base prefix — Railway always serves at /api/socket.io/.
 * When on the same origin (Replit), include the base prefix so path-routing works.
 */
export const SOCKET_PATH = API_BASE
  ? "/api/socket.io/"
  : `${import.meta.env.BASE_URL}api/socket.io/`;
