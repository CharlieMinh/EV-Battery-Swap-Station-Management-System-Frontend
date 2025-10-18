import axios from "axios";

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5194", // Use env variable
    timeout: 30000, // 10 seconds timeout
    withCredentials: true, // Allow sending cookies
});

// // Auto-add auth token to requests
// api.interceptors.request.use(config => {
//     // Try to get token from localStorage (used by Google Login)
//     const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

// Handle auth errors
// api.interceptors.response.use(
//     response => response,
//     error => {
//         if (error.response?.status === 401) {
//             // Token expired or invalid, redirect to login
//             localStorage.removeItem('token');
//             localStorage.removeItem('authToken');
//             sessionStorage.removeItem('authToken');
//             localStorage.removeItem('user');
//             window.location.href = '/login';
//         }
//         return Promise.reject(error);
//     }
// );

export default api;