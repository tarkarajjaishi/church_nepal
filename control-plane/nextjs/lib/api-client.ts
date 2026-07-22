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

export const setAuthToken = (token: string | null) => {
  tokenStore = token;
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

export const getAuthToken = () => tokenStore;

// Response interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to admin login
      setAuthToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("control_token");
        const path = window.location.pathname;
        if (path.startsWith("/admin") && path !== "/admin/login") {
          window.location.href = "/admin/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
