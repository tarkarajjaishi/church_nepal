import axios from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_CONTROL_API || "http://localhost:3100/api";

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
let tokenStore: string | null = null;
let refreshTokenStore: string | null = null;

export const setAuthToken = (token: string | null, refreshToken?: string | null) => {
  tokenStore = token;
  if (refreshToken !== undefined) {
    refreshTokenStore = refreshToken;
  } else if (!token) {
    refreshTokenStore = null;
  }
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

export const getAuthToken = () => tokenStore;
export const getRefreshToken = () => refreshTokenStore;

// Restore the session as soon as this module loads in the browser.
//
// The token lives in a module variable, which does not survive a page reload.
// Previously only app/admin/login/page.tsx read it back from localStorage, so
// landing directly on any other admin URL — a refresh, a bookmark, a shared
// link — left every request unauthenticated until the user happened to visit
// the login page. Rehydrating here fixes it for every route at once, because
// anything that talks to the API imports this module.
if (typeof window !== "undefined") {
  const storedToken = localStorage.getItem("control_token");
  if (storedToken) {
    setAuthToken(storedToken, localStorage.getItem("control_refresh_token"));
  }
}

// Refresh queue for concurrent 401s
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onRefreshed = (token: string, refreshToken: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
  setAuthToken(token, refreshToken);
  if (typeof window !== "undefined") {
    localStorage.setItem("control_token", token);
    localStorage.setItem("control_refresh_token", refreshToken);
  }
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Response interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._skipAuthRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          const callback = (token: string) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          };
          addRefreshSubscriber(callback);
        }) as Promise<any>;
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken() || (typeof window !== "undefined" ? localStorage.getItem("control_refresh_token") : null);

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await apiClient.post<{ token: string; refresh_token: string }>(
          "/auth/refresh",
          { refresh_token: refreshToken },
          { _skipAuthRefresh: true } as any
        );

        const { token, refresh_token } = response.data as { token: string; refresh_token: string };
        onRefreshed(token, refresh_token);
        return apiClient(originalRequest);
      } catch {
        setAuthToken(null, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("control_token");
          localStorage.removeItem("control_refresh_token");

          const path = window.location.pathname;
          if (path.startsWith("/admin") && path !== "/admin/login") {
            window.location.href = "/admin/login";
          }
        }
        isRefreshing = false;
        refreshSubscribers = [];
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
