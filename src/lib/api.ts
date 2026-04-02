import type { ApiResponse } from "@/types";

const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:3000";
const CHAT_API = process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://localhost:3001";

// ─── Helpers ────────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${AUTH_API}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Core fetch wrapper ─────────────────────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Thin fetch wrapper that:
 * - Always sends `credentials: 'include'`
 * - Sets `Content-Type: application/json` for bodies
 * - Unwraps the `{ok, data, error}` envelope
 * - On 401, attempts one token refresh and retries
 */
async function request<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const init: RequestInit = {
    ...rest,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let res = await fetch(url, init);

  // On 401 — try refreshing once, then retry
  if (res.status === 401) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      res = await fetch(url, init);
    }
  }

  // Still 401 after refresh — redirect to login
  if (res.status === 401) {
    let message = "Unauthorized";
    try {
      const json: ApiResponse<unknown> = await res.json();
      message = json.error ?? json.message ?? message;
    } catch {
      // stay with "Unauthorized"
    }

    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (pathname !== "/login" && pathname !== "/signup") {
        window.location.href = "/login";
      }
    }
    throw new Error(message);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.ok) {
    throw new Error(json.error ?? json.message ?? "Request failed");
  }

  return json.data;
}

// ─── Service-scoped helpers ─────────────────────────────────────────────────

export const authApi = {
  get: <T>(path: string, opts?: FetchOptions) =>
    request<T>(`${AUTH_API}${path}`, { ...opts, method: "GET" }),

  post: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    request<T>(`${AUTH_API}${path}`, { ...opts, method: "POST", body }),

  put: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    request<T>(`${AUTH_API}${path}`, { ...opts, method: "PUT", body }),

  delete: <T>(path: string, opts?: FetchOptions) =>
    request<T>(`${AUTH_API}${path}`, { ...opts, method: "DELETE" }),
};

export const chatApi = {
  get: <T>(path: string, opts?: FetchOptions) =>
    request<T>(`${CHAT_API}${path}`, { ...opts, method: "GET" }),

  post: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    request<T>(`${CHAT_API}${path}`, { ...opts, method: "POST", body }),

  put: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    request<T>(`${CHAT_API}${path}`, { ...opts, method: "PUT", body }),

  delete: <T>(path: string, opts?: FetchOptions) =>
    request<T>(`${CHAT_API}${path}`, { ...opts, method: "DELETE" }),
};
