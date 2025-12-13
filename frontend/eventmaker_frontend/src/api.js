import axios from 'axios';

// API клиент для работы с Django REST API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 секунд таймаут
});

const apiRequest = async (url, options = {}) => {
    try {
        const response = await api.request({
            url,
            ...options,
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`HTTP error! status: ${error.response.status} - ${error.response.data?.detail || error.message}`);
        } else if (error.request) {
            throw new Error('Сервер не отвечает. Проверьте, что Django сервер запущен на порту 8000');
        } else {
            throw new Error(`Ошибка запроса: ${error.message}`);
        }
    }
};

export const eventAPI = {
    getAllEvents: () => apiRequest('/events/', { method: 'GET' }),
    getEvent: (id) => apiRequest(`/events/${id}/`, { method: 'GET' }),
    createEvent: (eventData) => apiRequest('/events/', { method: 'POST', data: eventData }),
    updateEvent: (id, eventData) => apiRequest(`/events/${id}/`, { method: 'PUT', data: eventData }),
    deleteEvent: (id) => apiRequest(`/events/${id}/`, { method: 'DELETE' }),
    getMyEvents: () => apiRequest('/events/my_events/', { method: 'GET' }),

    // Задачи
    getMyTasks: () => apiRequest('/tasks/', { method: 'GET' }),
    createTask: (data) => apiRequest('/tasks/', { method: 'POST', data }),
    getMyTask: (id) => apiRequest(`/tasks/${id}/`, { method: 'GET' }),
    getMyTasksByEvent: (id) => apiRequest(`/events/${id}/tasks/`, { method: 'GET' }),
    changeTask: (id) => apiRequest(`/tasks/${id}/`, { method: 'PUT' }),
    deleteTask: (id) => apiRequest(`/tasks/${id}/`, { method: 'DELETE' }),

    // Заметки
    getAllNotes: () => apiRequest('/notes/', { method: 'GET' }),
    createNote: (eventId, data) =>
        apiRequest('/notes/', {
            method: 'POST',
            data: { ...data, event: eventId }, // ← ключевая правка
        }),
    getMyNote: (id) => apiRequest(`/notes/${id}/`, { method: 'GET' }),
    deleteMyNote: (id) => apiRequest(`/notes/${id}/`, { method: 'DELETE' }),

    // Финансы
    getMyFinances: () => apiRequest('/finance-items/', { method: 'GET' }),
    createFinanceForEvent: (eventId, data) =>
        apiRequest(`/events/${eventId}/finance/`, {
            method: 'POST',
            data: { ...data, event: eventId }, // ← ключевая правка
        }),
};

export default eventAPI;
