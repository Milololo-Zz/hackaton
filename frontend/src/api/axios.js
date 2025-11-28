// Archivo: src/api/axios.js
import axios from 'axios';

// 1. Definimos la URL base
const api = axios.create({
    baseURL: 'http://localhost:8000', // NOTA: Quité '/api' temporalmente para que coincida con tus rutas de auth
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor Mágico (Inyecta el Token automáticamente)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;