import axios from 'axios';
// interceptor.js
/**
 * Axios interceptor setup
 * Adds authentication token to requests and handles errors
 */
export const setupAxiosInterceptors = (store) => {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.auth = `${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  
    // Response interceptor
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('token');
          // Redirect to login or dispatch logout action
        }
        return Promise.reject(error);
      }
    );
  };
  