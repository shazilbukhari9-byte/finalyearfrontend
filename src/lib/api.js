import axios from 'axios';

// Set VITE_API_URL in .env to point at a different backend (e.g. http://127.0.0.1:5000).
const API_URL = (import.meta.env.VITE_API_URL || 'https://thefinalyearproject-backend.onrender.com').replace(/\/$/, '');

// Render's free tier sleeps when idle, so the first request can take up to a minute.
const api = axios.create({
  baseURL: API_URL,
  timeout: 90000,
});

export const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

export const isAuthError = (err) => err.response?.status === 401;

export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.code === 'ECONNABORTED') return 'The server is taking too long to respond. It may be waking up, please try again in a moment.';
  if (!err.response) return 'Cannot reach the server. Check your internet connection and try again.';
  return fallback;
};

export default api;
