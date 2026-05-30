import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle common API errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If unauthorized, you might want to logout the user
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized access - maybe token expired.");
      // Optional: You can trigger a logout here if needed
      // localStorage.removeItem("admin-token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
