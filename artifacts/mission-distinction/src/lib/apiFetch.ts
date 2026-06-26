export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("mission_token");
  const headers = new Headers(init.headers ?? {});
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });
  if (response.status !== 401) return response;

  try {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!refreshRes.ok) {
      window.dispatchEvent(new Event("auth:logout"));
      return response;
    }
    const data = await refreshRes.json();
    localStorage.setItem("mission_token", data.token);
    localStorage.setItem("mission_user", JSON.stringify(data.user));
    window.dispatchEvent(new CustomEvent("auth:tokenRefreshed", { detail: data }));

    const retryHeaders = new Headers(init.headers ?? {});
    retryHeaders.set("authorization", `Bearer ${data.token}`);
    return fetch(input, { ...init, headers: retryHeaders });
  } catch {
    window.dispatchEvent(new Event("auth:logout"));
    return response;
  }
}
