import api from './axios';

export const servicios = {
    // --- MÓDULO DE IDENTIDAD Y USUARIO ---
    auth: {
        login: async (username, password) => {
            const response = await api.post('/auth/jwt/create/', { username, password });
            return response.data;
        },
        register: (datos) => {
            return api.post('/auth/users/', datos);
        },
        // ¡ESTO FALTABA! Para saber quién soy y mi colonia
        getPerfil: () => {
            return api.get('/api/perfil/me/');
        },
        logout: () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    },

    // --- MÓDULO DE REPORTES CIUDADANOS ---
    reportes: {
        // Mapa General
        getAll: () => {
            return api.get('/api/reportes/');
        },
        // ¡ESTO FALTABA! Para la lista del sidebar
        getMisReportes: () => {
            return api.get('/api/reportes/mis_reportes/');
        },
        // Crear nuevo
        crear: (formData) => {
            return api.post('/api/reportes/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        // ¡ESTO FALTABA! Validación Anti-Buzón
        validar: (id) => {
            return api.post(`/api/reportes/${id}/validar/`);
        }
    },

    // --- 3. INFORMACIÓN PÚBLICA ---
    publico: {
        getNoticias: () => api.get('/api/noticias/'),
        getPozos: () => api.get('/api/pozos/'),
    },

    // --- MÓDULO DE GOBIERNO (ADMIN DASHBOARD) ---
    // ¡TODO ESTO FALTABA! Sin esto, la pantalla de Admin no carga
    admin: {
        getEstadisticas: () => api.get('/api/admin-dashboard/estadisticas_generales/'),
        getGraficaSemanal: () => api.get('/api/admin-dashboard/reporte_semanal/'),
        // URL directa para el botón href (no usa axios)
        urlExportar: 'http://localhost:8000/api/admin-dashboard/exportar_reportes/'
    }
};