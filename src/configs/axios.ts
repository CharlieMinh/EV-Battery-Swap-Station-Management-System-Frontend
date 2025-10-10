import axios from "axios";

// Create axios instance
const api = axios.create({
    baseURL: "http://localhost:5194/api", // Default fallback
    timeout: 10000, // 10 seconds timeout
});

// Auto-add auth token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token expired or invalid, redirect to login
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;