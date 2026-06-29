import { getTokenRefresher } from "@workspace/api-client-react";

/**
 * Lightweight fetch wrapper used across admin/student pages.
 *
 * On a 401 response it delegates to the SAME token-refresher that AuthContext
 * registered via setTokenRefresher — which holds a shared Promise lock so that
 * parallel 401s (common on Android when the app resumes) only ever trigger a
 * single rotation instead of N competing ones.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("mission_token");
  const headers = new Headers(init.headers ?? {});
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers, credentials: init.credentials ?? "include" });
  if (response.status !== 401) return response;

  // Use the shared refresher registered by AuthContext (includes the Promise
  // lock that prevents concurrent rotations from cascading into logouts).
  const refresher = getTokenRefresher();
  if (!refresher) {
    window.dispatchEvent(new Event("auth:logout"));
    return response;
  }

  try {
    const newToken = await refresher();
    if (!newToken) return response;

    const retryHeaders = new Headers(init.headers ?? {});
    retryHeaders.set("authorization", `Bearer ${newToken}`);
    return fetch(input, { ...init, headers: retryHeaders, credentials: init.credentials ?? "include" });
  } catch {
    window.dispatchEvent(new Event("auth:logout"));
    return response;
  }
}
