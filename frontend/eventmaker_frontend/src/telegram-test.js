// telegram-test.js - ТЕСТОВЫЙ СКРИПТ
async function testTelegramAuth() {
    console.log('=== ТЕСТ ТЕЛЕГРАМ АВТОРИЗАЦИИ ===');
    
    // 1. Проверяем, что мы в Telegram Web App
    if (!window.Telegram?.WebApp) {
        console.log('❌ НЕ в Telegram Web App!');
        return;
    }
    
    const tg = window.Telegram.WebApp;
    console.log('✅ В Telegram Web App. Данные:', {
        initData: tg.initData,
        user: tg.initDataUnsafe?.user,
        version: tg.version
    });
    
    // 2. Пытаемся авторизоваться
    try {
        const response = await fetch('https://fittingly-formidable-tayra.cloudpub.ru/api/auth/telegram/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: tg.initData
            })
        });
        
        const data = await response.json();
        console.log('✅ Ответ от /auth/telegram/:', data);
        
        if (data.token) {
            console.log('🎉 ТОКЕН ПОЛУЧЕН! Сохраняем...');
            localStorage.setItem('auth_token', data.token);
            
            // 3. Пробуем сделать запрос с токеном
            const testResponse = await fetch('https://fittingly-formidable-tayra.cloudpub.ru/api/events/', {
                headers: {
                    'Authorization': `Token ${data.token}`
                }
            });
            
            console.log('📊 Тест запроса к /api/events/:', {
                status: testResponse.status,
                data: await testResponse.json().catch(() => 'не json')
            });
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

// Запускаем тест при загрузке
if (typeof window !== 'undefined') {
    window.testTelegramAuth = testTelegramAuth;
    console.log('Тест-функция доступна как window.testTelegramAuth()');
}