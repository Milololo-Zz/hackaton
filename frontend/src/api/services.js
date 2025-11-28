import api from './axios';

export const servicios = {
    // --- 1. AUTENTICACIÓN ---
    auth: {
        login: async (username, password) => {
            const response = await api.post('/auth/jwt/create/', { username, password });
            return response.data;
        },
        register: (datos) => api.post('/auth/users/', datos),
        getPerfil: () => api.get('/api/perfil/me/'),
        logout: () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    },

    // --- 2. GESTIÓN DE REPORTES (Ciudadano y Gobierno) ---
    reportes: {
        // Ver todos (Mapa y Lista Admin)
        getAll: () => api.get('/api/reportes/'),
        
        // Ver solo los míos (Ciudadano)
        getMisReportes: () => api.get('/api/reportes/mis_reportes/'),
        
        // Crear (Ciudadano)
        crear: (formData) => api.post('/api/reportes/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        
        // Validar (Anti-Buzón)
        validar: (id) => api.post(`/api/reportes/${id}/validar/`),

        // ACTUALIZAR (SOLO GOBIERNO - PATCH)
        // Sirve para: Cambiar estatus, asignar pipa, agregar nota
        gestionar: (id, formData) => api.patch(`/api/reportes/${id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // --- 3. RECURSOS DE GOBIERNO (PIPAS) ---
    pipas: {
        getAll: () => api.get('/api/pipas/'), // Para llenar el Select del Admin
    },

    // --- 4. INFORMACIÓN PÚBLICA ---
    publico: {
        getNoticias: () => api.get('/api/noticias/'),
        getPozos: () => api.get('/api/pozos/'),
    },

    // --- 5. INTELIGENCIA (DASHBOARD) ---
    admin: {
        getEstadisticas: () => api.get('/api/admin-dashboard/estadisticas_generales/'),
        getGraficaSemanal: () => api.get('/api/admin-dashboard/reporte_semanal/'),
        urlExportar: 'http://localhost:8000/api/admin-dashboard/exportar_reportes/'
    }
};
