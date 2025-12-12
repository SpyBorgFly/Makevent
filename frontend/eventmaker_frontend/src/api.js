import axios from 'axios';

// API клиент для работы с Django REST API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 секунд таймаут
});

// Функция для выполнения HTTP запросов
const apiRequest = async (url, options = {}) => {
    try {
        const response = await api.request({
            url,
            ...options,
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            // Сервер ответил с кодом ошибки
            throw new Error(`HTTP error! status: ${error.response.status} - ${error.response.data?.detail || error.message}`);
        } else if (error.request) {
            // Запрос был отправлен, но ответа не было
            throw new Error('Сервер не отвечает. Проверьте, что Django сервер запущен на порту 8000');
        } else {
            // Что-то пошло не так при настройке запроса
            throw new Error(`Ошибка запроса: ${error.message}`);
        }
    }
};

// API для работы с событиями
export const eventAPI = {
    // Получить все события
    getAllEvents: () => apiRequest('/events/', { method: 'GET' }),

    // Получить событие по ID
    getEvent: (id) => apiRequest(`/events/${id}/`, { method: 'GET' }),

    // Создать новое событие
    createEvent: (eventData) => apiRequest('/events/', {
        method: 'POST',
        data: eventData,
    }),

    // Обновить событие
    updateEvent: (id, eventData) => apiRequest(`/events/${id}/`, {
        method: 'PUT',
        data: eventData,
    }),

    // Удалить событие
    deleteEvent: (id) => apiRequest(`/events/${id}/`, {
        method: 'DELETE',
    }),

    // Получить события текущего пользователя
    getMyEvents: () => apiRequest('/events/my_events/', { method: 'GET' }),

    // Получить все задачи
    getMyTasks: () => apiRequest('/'),

    // Создать задачу
    createTask: (eventData) => apiRequest('/tasks/', { method: 'POST', data: eventData }),

    // Получить конкретную задачу
    getMyTask: (id) => apiRequest(`/tasks/${id}/`, { method: 'GET' }),

    // Получить конкретную задачу у события
    getMyTasksByEvent: (id) => apiRequest(`/events/${id}/tasks/`, { method: 'GET' }),

    //Получить все заметки
     getAllNotes: () => apiRequest('/notes/', { method: 'GET' }),

    createNote: (eventId, data) =>
        apiRequest('/notes/', {
            method: 'POST',
            data: { ...data, event: eventId }, // ← важно
        }),

    getMyNote: (id) => apiRequest(`/notes/${id}/`, { method: 'GET' }),
    deleteMyNote: (id) => apiRequest(`/notes/${id}/`, { method: 'DELETE' }),

    createFinanceForEvent: (eventId, data) =>
        apiRequest(`/events/${eventId}/finance/`, {
            method: 'POST',
            data: { ...data, event: eventId }, // ← ключевая правка
        }),
};

export default eventAPI;