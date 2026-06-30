import { getTokenRefresher } from "@workspace/api-client-react";

/**
 * Lightweight fetch wrapper used across admin/student pages.
 *
 * On a 401 response it delegates to the SAME token-refresher that AuthContext
 * registered via setTokenRefresher — which holds a shared Promise lock so that
 * parallel 401s (common on Android when the app resumes) only ever trigger a
 * single rotation instead of N competing ones.
 */
/**
 * Like apiFetch but throws on non-2xx so React Query marks the query as
 * failed instead of silently treating an error JSON body as success data.
 * Use this in all queryFn callbacks that return arrays or objects.
 */
export async function apiFetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(input, init ?? {});
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("mission_token");
  const headers = new Headers(init.headers ?? {});
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }
  // Auto-set JSON content-type when body is a string (JSON.stringify output)
  // and the caller hasn't already specified a content-type.
  if (typeof init.body === "string" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
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

    const retryHeaders = new Headers(headers); // inherit auto-set content-type
    retryHeaders.set("authorization", `Bearer ${newToken}`);
    return fetch(input, { ...init, headers: retryHeaders, credentials: init.credentials ?? "include" });
  } catch {
    window.dispatchEvent(new Event("auth:logout"));
    return response;
  }
}
