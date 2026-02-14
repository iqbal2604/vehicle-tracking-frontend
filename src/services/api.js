import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/login', { email, password }),
    register: (data) => api.post('/register', data),
    getProfile: () => api.get('/profile'),
    getUsers: () => api.get('/users'),
    logout: () => api.post('/logout'),
};

// Vehicle API
export const vehicleAPI = {
    getAll: () => api.get('/vehicles'),
    getById: (id) => api.get(`/vehicles/${id}`),
    getByUserId: (userId) => api.get(`/vehicles/user/${userId}`),
    create: (data) => api.post('/vehicles', data),
    update: (id, data) => api.put(`/vehicles/${id}`, data),
    delete: (id) => api.delete(`/vehicles/${id}`),
    getLocations: (id) => api.get(`/vehicles/${id}/locations`),
};

// GPS/Location API
export const locationAPI = {
    // Backend doesn't have getAll locations. We must fetch per vehicle.
    getLast: (vehicleId) => api.get(`/gps/last/${vehicleId}`),
    getHistory: (vehicleId) => api.get(`/gps/history/${vehicleId}`),
    create: (data) => api.post(`/gps`, data),
};

// Logs API
export const logsAPI = {
    getAll: (params) => api.get('/logs', { params }),
    getByVehicleId: (vehicleId, params) => api.get(`/logs/vehicle/${vehicleId}`, { params }),
};

export default api;
