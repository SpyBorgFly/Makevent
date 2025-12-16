import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import eventAPI from "../api";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";

export function HomePage() {
    const [dataEvents, setDataEvents] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [userName, setUserName] = useState('Друг'); // Имя пользователя по умолчанию
    const [authChecked, setAuthChecked] = useState(false);

    // Функция проверки валидности токена
    const verifyToken = useCallback(async (token) => {
        if (!token) return false;
        
        try {
            const response = await fetch('/api/auth/verify/', {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            
            return response.ok;
        } catch (error) {
            console.log('Ошибка проверки токена:', error);
            return false;
        }
    }, []);

    // Функция автоматической авторизации через Telegram
    const performAutoAuth = useCallback(async () => {
        const tg = window.Telegram?.WebApp;
        if (!tg) {
            console.log('Telegram Web App не доступен');
            return false;
        }

        tg.ready();
        
        // Получаем данные пользователя
        const userData = tg.initDataUnsafe?.user;
        if (!userData) {
            console.log('Данные пользователя Telegram не получены');
            return false;
        }

        // Устанавливаем имя пользователя
        setUserName(userData.first_name || 'Друг');
        
        // Проверяем, есть ли токен и он валиден
        const existingToken = localStorage.getItem('auth_token');
        if (existingToken) {
            console.log('Токен есть, проверяем валидность...');
            
            const isValid = await verifyToken(existingToken);
            if (isValid) {
                console.log('Токен валиден:', existingToken.substring(0, 20) + '...');
                return true;
            } else {
                console.log('Токен невалиден, удаляем его');
                localStorage.removeItem('auth_token');
                // Продолжаем с авторизацией
            }
        }

        console.log('Выполняем автоматическую авторизацию...');
        
        try {
            const response = await fetch('/api/auth/telegram/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            console.log('Статус авторизации:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('auth_token', data.token);
                    console.log('Токен сохранен:', data.token.substring(0, 20) + '...');
                    
                    // Показываем уведомление
                    tg.showAlert(`Добро пожаловать, ${userData.first_name || 'Друг'}!`);
                    return true;
                }
            } else {
                const errorText = await response.text();
                console.error('Ошибка авторизации:', response.status, errorText);
                
                // Если 403, пробуем тестовый эндпоинт
                if (response.status === 403) {
                    console.log('Получен 403, пробуем тестовую авторизацию...');
                    try {
                        const testResponse = await fetch('/api/auth/simple-telegram/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({test: true})
                        });
                        
                        if (testResponse.ok) {
                            const testData = await testResponse.json();
                            if (testData.token) {
                                localStorage.setItem('auth_token', testData.token);
                                console.log('Тестовый токен сохранен:', testData.token.substring(0, 20) + '...');
                                return true;
                            }
                        } else {
                            console.error('Тестовая авторизация тоже не удалась:', testResponse.status);
                        }
                    } catch (testError) {
                        console.error('Ошибка тестовой авторизации:', testError);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка сети при авторизации:', error);
        }
        
        return false;
    }, [verifyToken]);

    // ФИКС: Защита от не-массивов + useCallback для мемоизации
    const fetchEvents = useCallback(async () => {
        try {
            const response = await eventAPI.getAllEvents();
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.log('Ошибка загрузки событий:', error);
            return [];
        }
    }, []);

    // ФИКС: Защита от не-массивов + useCallback
    const fetchAllTasks = useCallback(async () => {
        try {
            const response = await eventAPI.getMyTasks();
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.log('Ошибка загрузки задач:', error);
            return [];
        }
    }, []);

    // Функция обновления данных
    const refreshData = async () => {
        try {
            setLoading(true);
            
            const token = localStorage.getItem('auth_token');
            if (!token) {
                console.log('Нет токена, пропускаем загрузку данных');
                setLoading(false);
                return;
            }
            
            // Проверяем токен перед загрузкой данных
            const isValid = await verifyToken(token);
            if (!isValid) {
                console.log('Токен невалиден, удаляем его');
                localStorage.removeItem('auth_token');
                setLoading(false);
                return;
            }
            
            const [events, tasks] = await Promise.all([
                fetchEvents(),
                fetchAllTasks()
            ]);
            
            setDataEvents(events);
            setAllTasks(tasks);
            setLastUpdateTime(new Date());
            
        } catch (error) {
            console.error('Ошибка обновления данных:', error);
            
            // Если ошибка 401, удаляем токен
            if (error.response?.status === 401) {
                console.log('Получен 401, удаляем токен');
                localStorage.removeItem('auth_token');
            }
        } finally {
            setLoading(false);
        }
    };

    // Основная загрузка данных при монтировании
    useEffect(() => {
        const initializeApp = async () => {
            console.log('Инициализация приложения...');
            
            // 1. Проверяем и выполняем авторизацию
            const isAuthenticated = await performAutoAuth();
            setAuthChecked(true);
            
            // 2. Если авторизованы - загружаем данные
            if (isAuthenticated) {
                await refreshData();
            } else {
                console.log('Пользователь не авторизован');
                setLoading(false);
            }
        };

        // Добавляем небольшую задержку для инициализации Telegram Web App
        const timer = setTimeout(() => {
            initializeApp();
        }, 300);
        
        return () => clearTimeout(timer);
    }, [performAutoAuth, fetchEvents, fetchAllTasks]);

    // Слушаем события обновления данных
    useEffect(() => {
        const handleRefresh = () => {
            console.log('Получен сигнал обновления данных');
            refreshData();
        };
        
        window.addEventListener('refreshAllData', handleRefresh);
        window.addEventListener('cacheInvalidated', handleRefresh);
        
        return () => {
            window.removeEventListener('refreshAllData', handleRefresh);
            window.removeEventListener('cacheInvalidated', handleRefresh);
        };
    }, []);

    // Экспортируем функцию обновления для использования в других компонентах
    useEffect(() => {
        window.refreshHomePageData = refreshData;
        return () => {
            delete window.refreshHomePageData;
        };
    }, []);

    const getEventStatusText = (status) => {
        switch (status) {
            case 'planned': return 'Планируется';
            case 'in_progress': return 'В работе';
            case 'completed': return 'Завершено';
            case 'cancelled': return 'Отменено';
            default: return status;
        }
    };

    const getEventStatusColor = (status) => {
        switch (status) {
            case 'planned': return 'error';
            case 'in_progress': return 'work';
            case 'completed': return 'notes';
            case 'cancelled': return 'cancelled';
            default: return 'work';
        }
    };

    const getTaskStatusText = (status) => {
        switch (status) {
            case 'todo': return 'К выполнению';
            case 'in_progress': return 'В работе';
            case 'done': return 'Выполнено';
            case 'cancelled': return 'Отменено';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    const getDaysUntilDeadline = (dueDate) => {
        if (!dueDate) return null;
        const today = new Date();
        const deadline = new Date(dueDate);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getNearestEvents = () => {
        if (!dataEvents || dataEvents.length === 0) return [];

        const futureEvents = dataEvents.filter(event => {
            const eventDate = new Date(event.event_day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return eventDate >= today && event.status !== 'done';
        });

        return futureEvents
            .sort((a, b) => new Date(a.event_day) - new Date(b.event_day))
            .slice(0, 3);
    };

    const getNearestDeadlines = () => {
        if (!allTasks || allTasks.length === 0) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasksWithDeadlines = allTasks.filter(task => {
            if (!task.due_date || task.status === 'done' || task.status === 'cancelled') {
                return false;
            }

            const deadline = new Date(task.due_date);
            deadline.setHours(0, 0, 0, 0);

            return deadline >= today;
        });

        return tasksWithDeadlines
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 3);
    };

    const getUrgentDeadlinesCount = () => {
    if (!allTasks || allTasks.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 7);
    threeDaysLater.setHours(23, 59, 59, 999);

    return allTasks.filter(task => {
        if (!task.due_date || task.status === 'done' || task.status === 'cancelled') {
            return false;
        }

        const deadline = new Date(task.due_date);
        deadline.setHours(0, 0, 0, 0);

        return deadline <= threeDaysLater && deadline >= today;
    }).length;
};

    const nearestEvents = getNearestEvents();
    const nearestDeadlines = getNearestDeadlines();
    const urgentDeadlinesCount = getUrgentDeadlinesCount();

    if (loading) {
        return (
            <>
                <Header />
                <main className="main">
                    <div className="main__container">
                        <div className="loading">Загрузка...</div>
                        {lastUpdateTime && (
                            <div className="last-update">
                                Последнее обновление: {lastUpdateTime.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </main>
                <MobileHeader />
            </>
        );
    }

    // Если не авторизован, показываем сообщение
    if (authChecked && !localStorage.getItem('auth_token')) {
        return (
            <>
                <Header />
                <main className="main">
                    <div className="main__container">
                        <div className="auth-required" style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '15px',
                            color: 'white',
                            marginTop: '50px'
                        }}>
                            <div style={{fontSize: '60px', marginBottom: '20px'}}>🔐</div>
                            <h2 style={{marginBottom: '15px'}}>Требуется авторизация</h2>
                            <p style={{marginBottom: '25px', fontSize: '16px', opacity: 0.9}}>
                                Для работы с приложением необходимо войти через Telegram
                            </p>
                            <p style={{
                                fontSize: '14px',
                                opacity: 0.7,
                                marginTop: '30px',
                                padding: '10px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '8px'
                            }}>
                                ⚠️ Если авторизация не происходит автоматически,<br/>
                                попробуйте перезагрузить Mini App (потяните вниз)
                            </p>
                        </div>
                    </div>
                </main>
                <MobileHeader />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="main">
                <div className="main__container">
                    {/* Кнопка для принудительного обновления данных */}
                    <div style={{
                        textAlign: 'right',
                        marginBottom: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{fontSize: '14px', color: '#666'}}>
                            {lastUpdateTime && `Обновлено: ${lastUpdateTime.toLocaleTimeString()}`}
                        </div>
                        <button 
                            onClick={refreshData}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f0f0f0',
                                color: '#333',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                            title="Обновить данные"
                        >
                            🔄 Обновить
                        </button>
                    </div>
                    
                    <section className="main__top-section">
                        <div className="main__top-section-header">
                            {/* ИСПРАВЛЕНО: Динамическое имя пользователя */}
                            <h1 className="main__h1 h1">Добрый день, {userName}!</h1>
                            <span className="main__top-section-text-1">У вас запланировано </span>
                            <span className="main__top-section-text-2">{dataEvents.length} мероприят
                                {dataEvents.length >= 2 && dataEvents.length <= 4 ? "ия" :
                                    dataEvents.length === 1 ? "ие" :
                                        dataEvents.length === 0 ? "ий" : "ий"}</span>
                        </div>
                        <div className="main__top-section-event-boxes">
                            <div className="main__top-section-event-box shadow-glass">
                                <span className="main__top-section-event-box-count in-progress">
                                    {nearestEvents.length}
                                </span>
                                <span className="main__top-section-event-box-text">Ближайших события</span>
                            </div>
                            <div className="main__top-section-event-box shadow-glass">
                                <span className="main__top-section-event-box-count deadline">
                                    {urgentDeadlinesCount}
                                </span>
                                <span className="main__top-section-event-box-text">Срочных дедлайнов</span>
                            </div>
                        </div>
                    </section>

                    <section className="widgets">
                        <div className="widgets__card shadow-glass">
                            <div className="widgets__card-header-section">
                                <h2 className="widgets__card-header">Ближайшие ивенты</h2>
                                <Link to="/events" className="widgets__card-header-link">Все</Link>
                            </div>
                            <div className="widgets__card-event-list">
                                {nearestEvents.length > 0 ? (
                                    nearestEvents.map((event) => {
                                        const date = new Date(event.event_day);
                                        const dayOfDate = date.getDate();
                                        const monthNames = [
                                            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                                            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
                                        ];
                                        const monthName = monthNames[date.getMonth()];

                                        return (
                                            <Link to={`/events/${event.id}`} key={event.id} className="widgets__card-event shadow-glass">
                                                <div className="card-event-date">
                                                    <span className="card-event-date__day">{dayOfDate}</span>
                                                    <span className="card-event-date__month">{monthName}</span>
                                                </div>
                                                <div className="card-event-description">
                                                    <span className="card-event-description__header">{event.title}</span>
                                                    <span className="card-event-description__datetime">
                                                        {dayOfDate} {monthName}, {formatTime(event.event_time)}
                                                    </span>
                                                </div>
                                                <div className={`card-event-status ${getEventStatusColor(event.status)}`}>
                                                    {getEventStatusText(event.status)}
                                                </div>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <div className="no-events-message">
                                        <p>Ближайших событий нет</p>
                                        <p style={{fontSize: '14px', color: '#666', marginTop: '10px'}}>
                                            Создайте первое событие!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="widgets__card shadow-glass">
                            <div className="widgets__card-header-section">
                                <h2 className="widgets__card-header">Ближайшие дедлайны</h2>
                                <Link to="/events" className="widgets__card-header-link">Все события</Link>
                            </div>
                            <div className="widgets__card-event-list">
                                {nearestDeadlines.length > 0 ? (
                                    nearestDeadlines.map((task) => {
                                        const daysUntil = getDaysUntilDeadline(task.due_date);
                                        let deadlineText = '';
                                        let urgencyLevel = '';

                                        if (daysUntil === 0) {
                                            deadlineText = 'Сегодня';
                                            urgencyLevel = 'error';
                                        } else if (daysUntil === 1) {
                                            deadlineText = 'Завтра';
                                            urgencyLevel = 'error';
                                        } else if (daysUntil <= 3) {
                                            deadlineText = `Через ${daysUntil} дня`;
                                            urgencyLevel = 'error';
                                        } else if (daysUntil <= 7) {
                                            deadlineText = `Через ${daysUntil} дней`;
                                            urgencyLevel = 'notes';
                                        } else {
                                            deadlineText = formatDate(task.due_date);
                                            urgencyLevel = 'work';
                                        }

                                        return (
                                            <Link
                                                to={`/events/${task.event}`}
                                                key={task.id}
                                                className="widgets__card-event shadow-glass"
                                            >
                                                <div className="card-event-date">
                                                    <span className="card-event-date__day">
                                                        {new Date(task.due_date).getDate()}
                                                    </span>
                                                    <span className="card-event-date__month">
                                                        {formatDate(task.due_date).split(' ')[1]}
                                                    </span>
                                                </div>
                                                <div className="card-event-description">
                                                    <span className="card-event-description__header">{task.title}</span>
                                                    <span className="card-event-description__datetime">{deadlineText}</span>
                                                    <span className="card-event-description__event">
                                                        Событие: {dataEvents.find(e => e.id === task.event)?.title || `ID: ${task.event}`}
                                                    </span>
                                                </div>
                                                <div className={`card-event-status ${urgencyLevel}`}>
                                                    {getTaskStatusText(task.status)}
                                                </div>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <div className="no-deadlines-message">
                                        <p>Срочных дедлайнов нет</p>
                                        <p style={{fontSize: '14px', color: '#666', marginTop: '10px'}}>
                                            Все задачи выполнены вовремя! 🎉
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <MobileHeader />
        </>
    );
}