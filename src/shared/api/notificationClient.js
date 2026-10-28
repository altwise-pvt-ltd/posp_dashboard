import axios from 'axios';
import { ApiError } from './ApiError';


const BASE_URL = import.meta.env.VITE_NOTIFICATION_BASE_URL;
const API_KEY = import.meta.env.VITE_NOTIFICATION_API_KEY;

if (!BASE_URL) {
  console.warn(
    '[notificationClient] VITE_NOTIFICATION_BASE_URL is not set — the Marketing Kit will not load. Copy .env.example to .env.local.'
  );
}

if (!API_KEY) {
  console.warn(
    '[notificationClient] VITE_NOTIFICATION_API_KEY is not set — every call to the notification service will be rejected.'
  );
}

export const notificationApi = axios.create({
  baseURL: BASE_URL || '/',
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
  },
});


notificationApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(ApiError.from(error))
);
