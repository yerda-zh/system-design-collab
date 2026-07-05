import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Create an axios instance with our server's base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// Interceptor — runs before every request
// Automatically adds the JWT token to every request header
// so we don't have to do it manually in every API call
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — runs after every response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401, the token is expired or invalid
    // Clear auth state so the user is redirected to login
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;