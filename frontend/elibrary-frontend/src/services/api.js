import axios from 'axios';

// Base path for our API calls, proxied through package.json.
const API_BASE_PATH = '/api';

// --- publicApi: For requests that do NOT require authentication (e.g., login, register, browse books) ---
export const publicApi = axios.create({
  baseURL: API_BASE_PATH,
});

// --- authApi: For requests that DO require authentication (e.g., profile, admin users, add/update/delete books) ---
export const authApi = axios.create({
  baseURL: API_BASE_PATH,
});

// Interceptor for 'authApi' to automatically attach the JWT token.
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken'); // Get token from local storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Add Bearer token
    }
    return config; // Return the modified config
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for 'authApi' to handle 401 Unauthorized responses globally.
authApi.interceptors.response.use(
  (response) => response, // If response is successful, just pass it through
  (error) => {
    // If a 401 Unauthorized response is received, clear token and suggest re-login
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized access: JWT token might be expired or invalid. Logging out.');
      localStorage.removeItem('jwtToken'); // Clear stale token
      alert('Your session has expired or is invalid. Please log in again.'); // User-friendly alert
      window.location.reload(); // Reload the page to reset application state
    }
    return Promise.reject(error); // For any other error, reject the Promise
  }
);