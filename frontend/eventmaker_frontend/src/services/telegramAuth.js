// telegramAuth.js - БАЗОВАЯ ПРОВЕРКА
const BACKEND_URL = 'https://fittingly-formidable-tayra.cloudpub.ru/api';

export async function initTelegramAuth() {
    console.log('Пытаемся авторизоваться через Telegram...');
    
    // 1. Проверяем, что мы в Telegram
    if (!window.Telegram?.WebApp) {
        console.log('Не в Telegram. Работаем в режиме разработки.');
        return null;
    }
    
    const tg = window.Telegram.WebApp;
    tg.ready(); // Говорим Telegram, что мы готовы
    
    // 2. Берём данные Telegram
    const initData = tg.initData;
    
    if (!initData) {
        console.log('Нет данных от Telegram (открыто в браузере)');
        return null;
    }
    
    console.log('Данные Telegram получены, отправляем на бэкенд...');
    
    try {
        // 3. Отправляем на бэкенд
        const response = await fetch(`${BACKEND_URL}/auth/telegram/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: initData })
        });
        
        const result = await response.json();
        console.log('Ответ от бэкенда:', result);
        
        // 4. Сохраняем токен (если он есть)
        if (result.token) {
            localStorage.setItem('auth_token', result.token);
            console.log('✅ Токен сохранён');
            return result.token;
        }
        
        return null;
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        return null;
    }
}

// Функция для получения токена из хранилища
export function getAuthToken() {
    return localStorage.getItem('auth_token');
}