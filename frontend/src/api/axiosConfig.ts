// src/api/axiosConfig.ts
import axios from 'axios';

// 1. Create a configured instance of axios
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Your Laravel Backend URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 2. Add an "Interceptor" to attach the Token to every request automatically
api.interceptors.request.use(
  // We use 'any' here to prevent the "InternalAxiosRequestConfig" version error
  (config: any) => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Ensure headers object exists, then assign the token
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;