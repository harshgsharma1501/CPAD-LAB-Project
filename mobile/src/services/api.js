import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamically use current hostname on web (e.g. localhost:5000), or laptop IP for mobile
const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://10.99.18.39:5000/api';
};

export const API_BASE_URL = getBaseUrl();

let onUnauthorizedCallback = null;
let currentAuthToken = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorizedCallback = fn;
}

export function setApiToken(token) {
  currentAuthToken = token || null;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically to every request from in-memory cache or AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      let token = currentAuthToken;
      if (!token) {
        token = await AsyncStorage.getItem('token');
        if (token) currentAuthToken = token;
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token from storage in request interceptor:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Catch 401 Unauthorized globally and trigger auto-logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (onUnauthorizedCallback) {
        try {
          await onUnauthorizedCallback();
        } catch (_) {}
      }
    }
    return Promise.reject(error);
  }
);

export default api;
