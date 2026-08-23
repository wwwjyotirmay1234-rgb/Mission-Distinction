/**
 * Central API configuration.
 *
 * On Railway: set VITE_API_URL to the public API service URL.
 * When frontend and API share one origin, leave it unset.
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/**
 * Socket.io server URL.
 * undefined = socket.io-client connects to the current origin.
 * A string = connects cross-origin to Railway.
 */
export const SOCKET_SERVER: string | undefined = API_BASE || undefined;

/**
 * Socket.io mount path.
 * When connecting cross-origin, skip the Vite base prefix — Railway always serves at /api/socket.io/.
 * When on the same origin, include the base prefix so path-routing works.
 */
export const SOCKET_PATH = API_BASE
  ? "/api/socket.io/"
  : `${import.meta.env.BASE_URL}api/socket.io/`;
