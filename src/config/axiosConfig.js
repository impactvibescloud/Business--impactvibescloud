import axios from 'axios';
import { getBaseURL, getHeaders } from './api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: getBaseURL(),  // Base URL without /api
  headers: getHeaders()
});

// Add request interceptor to update headers before each request
axiosInstance.interceptors.request.use(
  (config) => {
    // Update headers before each request to ensure we have the latest token
    config.headers = {
      ...config.headers,
      ...getHeaders()
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
