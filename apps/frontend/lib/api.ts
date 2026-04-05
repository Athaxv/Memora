const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─────────────────────────────────────────────────────────────
// Single-flight refresh
//
// Why: imagine the dashboard mounts and fires 5 parallel calls
// right as the access token expires. Each call sees 401. If each
// triggered its own /auth/refresh, the first would succeed and
// rotate the refresh token — and the other four would arrive at
// the backend with the now-revoked token. Reuse detection fires,
// the entire family is nuked, and the user is kicked to /login
// for no good reason.
//
// Fix: share ONE refresh promise across all concurrent callers.
// Exactly one rotation happens; all pending requests await the
// same outcome and retry with the new cookie.
// ─────────────────────────────────────────────────────────────
let refreshPromise: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const doFetch = () => {
    const headers = new Headers(options.headers);
    // Don't set Content-Type for FormData (browser sets multipart boundary)
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include", // ← cookies are auto-attached
      headers,
    });
  };

  let res = await doFetch();

  // On 401 (and not already on an /auth/* endpoint — that would
  // infinite-loop if /auth/refresh itself returns 401), try to
  // refresh once, then retry the original request exactly once.
  if (res.status === 401 && !path.startsWith("/auth/")) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      res = await doFetch();
    } else {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  return res;
}

// Exposed for sign-out (bypasses the api() wrapper's refresh-on-401
// behavior since /auth/logout should be fire-and-forget).
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // best effort
  }
}

export { API_URL };
