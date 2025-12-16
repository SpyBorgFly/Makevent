import axios from 'axios';

// API клиент для работы с Django REST API
const API_BASE_URL = window.location.origin + '/api';

// Настройки кэширования - ВКЛЮЧАЕМ, но с правильной логикой
const CACHE_CONFIG = {
    ENABLED: true,  // Включаем кэширование
    DEFAULT_TTL: 30 * 1000, // 30 секунд по умолчанию (коротко!)
    MAX_CACHE_SIZE: 20, // Меньше размер кэша
};

// Кэш в памяти
const cache = new Map();

// Функция для генерации ключа кэша С УЧЕТОМ ТОКЕНА
const generateCacheKey = (url, options) => {
    const method = options.method || 'GET';
    const dataKey = options.data ? JSON.stringify(options.data) : '';
    const token = localStorage.getItem('auth_token') || 'no-token';
    // Включаем префикс токена в ключ кэша
    return `${token.substring(0, 8)}:${method}:${url}:${dataKey}`;
};

// Очистка устаревших записей кэша
const cleanupCache = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > value.ttl) {
            cache.delete(key);
        }
    }
    
    // Ограничиваем размер кэша
    if (cache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
        const entries = Array.from(cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, Math.floor(entries.length * 0.5)); // Удаляем 50% самых старых
        toRemove.forEach(([key]) => cache.delete(key));
    }
};

// Получение из кэша
const getFromCache = (cacheKey) => {
    if (!CACHE_CONFIG.ENABLED) return null;
    
    cleanupCache();
    
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log(`📦 Кэш hit: ${cacheKey.split(':')[2]}`);
        return cached.data;
    }
    
    return null;
};

// Сохранение в кэш
const saveToCache = (cacheKey, data, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
    if (!CACHE_CONFIG.ENABLED) return;
    
    // НЕ кэшируем если нет токена (анонимные запросы)
    const token = localStorage.getItem('auth_token');
    if (!token) {
        return;
    }
    
    cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
    });
    
    cleanupCache();
};

// Очистка кэша при смене пользователя/токена
const validateCacheForCurrentUser = () => {
    const token = localStorage.getItem('auth_token') || 'no-token';
    const currentTokenPrefix = token.substring(0, 8);
    
    // Удаляем записи для других пользователей
    let removed = 0;
    for (const [key] of cache.entries()) {
        const keyTokenPrefix = key.split(':')[0];
        if (keyTokenPrefix !== currentTokenPrefix) {
            cache.delete(key);
            removed++;
        }
    }
    
    if (removed > 0) {
        console.log(`🧹 Удалено ${removed} записей кэша другого пользователя`);
    }
};

// Создаем экземпляр axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Перехватчик запросов
api.interceptors.request.use(
    (config) => {
        // ОЧЕНЬ ВАЖНО: Проверяем кэш перед каждым запросом
        validateCacheForCurrentUser();
        
        config.metadata = { startTime: Date.now() };
        
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Перехватчик ответов
api.interceptors.response.use(
    (response) => {
        const endTime = Date.now();
        const startTime = response.config.metadata?.startTime || endTime;
        const duration = endTime - startTime;
        
        console.log(`✅ ${response.status} ${response.config.url} (${duration}ms)`);
        
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            console.warn('Токен недействителен');
        }
        return Promise.reject(error);
    }
);

// Основная функция API запросов
const apiRequest = async (url, options = {}) => {
    const cacheKey = generateCacheKey(url, options);
    const method = options.method || 'GET';
    
    // Для GET запросов проверяем кэш
    if (method === 'GET') {
        const cachedData = getFromCache(cacheKey);
        if (cachedData !== null) {
            return cachedData;
        }
    } else {
        // Для не-GET запросов очищаем соответствующий кэш
        invalidateCacheForUrl(url);
    }
    
    try {
        const response = await api.request({
            url,
            ...options,
        });

        let resultData;
        
        // Простая и надежная обработка данных
        if (response.data) {
            // Приоритет: results -> data (массив) -> сам response.data
            if (response.data.results !== undefined) {
                resultData = Array.isArray(response.data.results) ? response.data.results : [];
            } else if (Array.isArray(response.data)) {
                resultData = response.data;
            } else {
                resultData = response.data;
            }
        } else {
            resultData = response.data;
        }

        // Кэшируем только успешные GET запросы с токеном
        if (method === 'GET' && response.status >= 200 && response.status < 300) {
            const token = localStorage.getItem('auth_token');
            if (token) {
                // Очень короткий TTL для динамических данных
                let ttl = CACHE_CONFIG.DEFAULT_TTL;
                if (url.includes('/events/') || url.includes('/tasks/') || url.includes('/notes/')) {
                    ttl = 10 * 1000; // Всего 10 секунд!
                }
                
                saveToCache(cacheKey, resultData, ttl);
            }
        }

        return resultData;

    } catch (error) {
        console.error('=== API ERROR ===');
        console.error('URL:', url, 'Status:', error.response?.status);

        if (error.response?.status === 404) {
            // Для 404 возвращаем пустой результат
            return url.includes('/') && !url.includes('.') ? [] : null;
        }
        
        throw error;
    }
};

// Функции для управления кэшем
export const clearApiCache = () => {
    cache.clear();
    console.log('🧹 Весь кэш API очищен');
};

export const invalidateCacheForUrl = (urlPattern) => {
    let cleared = 0;
    for (const [key] of cache.entries()) {
        if (key.includes(urlPattern)) {
            cache.delete(key);
            cleared++;
        }
    }
    if (cleared > 0) {
        console.log(`🧹 Очищено ${cleared} записей для: ${urlPattern}`);
    }
    
    // Отправляем событие для UI
    window.dispatchEvent(new CustomEvent('cacheInvalidated', { 
        detail: { endpoint: urlPattern } 
    }));
};

export const getCacheStats = () => {
    return {
        size: cache.size,
        maxSize: CACHE_CONFIG.MAX_CACHE_SIZE,
        enabled: CACHE_CONFIG.ENABLED
    };
};

export const eventAPI = {
    // === События ===
    getAllEvents: () => apiRequest('/events/', { method: 'GET' }),
    getEvent: (id) => apiRequest(`/events/${id}/`, { method: 'GET' }),
    createEvent: (eventData) => {
        invalidateCacheForUrl('/events/');
        return apiRequest('/events/', { method: 'POST', data: eventData });
    },
    updateEvent: (id, eventData) => {
        invalidateCacheForUrl('/events/');
        return apiRequest(`/events/${id}/`, { method: 'PUT', data: eventData });
    },
    deleteEvent: (id) => {
        invalidateCacheForUrl('/events/');
        return apiRequest(`/events/${id}/`, { method: 'DELETE' });
    },
    getMyEvents: () => apiRequest('/events/my_events/', { method: 'GET' }),

    // === Задачи ===
    getMyTasks: () => apiRequest('/tasks/', { method: 'GET' }),
    createTask: (data) => {
        invalidateCacheForUrl('/tasks/');
        return apiRequest('/tasks/', { method: 'POST', data });
    },
    getMyTask: (id) => apiRequest(`/tasks/${id}/`, { method: 'GET' }),
    getMyTasksByEvent: (id) => apiRequest(`/events/${id}/tasks/`, { method: 'GET' }),
    changeTask: (id, data) => {
        invalidateCacheForUrl('/tasks/');
        return apiRequest(`/tasks/${id}/`, { method: 'PUT', data });
    },
    deleteTask: (id) => {
        invalidateCacheForUrl('/tasks/');
        return apiRequest(`/tasks/${id}/`, { method: 'DELETE' });
    },

    // === Заметки ===
    getAllNotes: () => apiRequest('/notes/', { method: 'GET' }),
    createNote: (eventId, data) => {
        invalidateCacheForUrl('/notes/');
        return apiRequest('/notes/', {
            method: 'POST',
            data: { ...data, event: eventId },
        });
    },
    getMyNote: (id) => apiRequest(`/notes/${id}/`, { method: 'GET' }),
    deleteMyNote: (id) => {
        invalidateCacheForUrl('/notes/');
        return apiRequest(`/notes/${id}/`, { method: 'DELETE' });
    },

    // === Финансы ===
    getMyFinances: () => apiRequest('/finance-items/', { method: 'GET' }),
    createFinanceForEvent: (eventId, data) => {
        invalidateCacheForUrl('/finance-items/');
        return apiRequest(`/events/${eventId}/finance/`, {
            method: 'POST',
            data: { ...data, event: eventId },
        });
    },
    getFinanceReport: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/finance/report/?${queryString}`, {
            method: 'GET'
        });
    },
    
    // === Дополнительные методы ===
    getCurrentUser: () => apiRequest('/user/me/', { method: 'GET' }),
    healthCheck: () => apiRequest('/health/', { method: 'GET' }),
    
    // === Управление кэшем ===
    clearCache: clearApiCache,
    invalidateCache: invalidateCacheForUrl,
    getCacheStats: getCacheStats,
};

// Добавляем глобальную функцию для обновления данных
window.refreshApiData = () => {
    clearApiCache();
    window.dispatchEvent(new Event('refreshAllData'));
    console.log('🔄 Все данные обновлены');
};

export default eventAPI;