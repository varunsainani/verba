"use client";

const ACCESS_KEY = "verba_access";
const REFRESH_KEY = "verba_refresh";

export class ApiError extends Error {
  status: number;
  fields?: { path: string; message: string }[];
  constructor(status: number, message: string, fields?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh?: string) {
  window.localStorage.setItem(ACCESS_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens() {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

function currentLocale(): string {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "en";
}

async function rawFetch(
  path: string,
  options: RequestInit,
  withAuth: boolean,
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("X-Locale", currentLocale());
  const isForm = options.body instanceof FormData;
  if (options.body && !isForm) headers.set("Content-Type", "application/json");
  if (withAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`/api${path}`, { ...options, headers });
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await rawFetch(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken: refresh }) },
      false,
    );
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  options: RequestInit,
  withAuth = true,
  retry = true,
): Promise<T> {
  let res: Response;
  try {
    res = await rawFetch(path, options, withAuth);
  } catch {
    throw new ApiError(0, "network");
  }

  if (res.status === 401 && withAuth && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, withAuth, false);
  }

  if (!res.ok) {
    let body: { error?: string; fields?: { path: string; message: string }[] } = {};
    try {
      body = await res.json();
    } catch {
      /* non-json error */
    }
    throw new ApiError(res.status, body.error || "generic", body.fields);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: (path: string) => request<void>(path, { method: "DELETE" }),
};
