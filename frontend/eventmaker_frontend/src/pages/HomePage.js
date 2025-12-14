import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import eventAPI from "../api";
import { useEffect, useState } from "react";
import { Link } from "react-router";

export function HomePage() {
    const [dataEvents, setDataEvents] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const response = await eventAPI.getAllEvents();
            return response || [];
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    const fetchAllTasks = async () => {
        try {
            const response = await eventAPI.getMyTasks();
            return response || [];
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [events, tasks] = await Promise.all([
                    fetchEvents(),
                    fetchAllTasks()
                ]);
                setDataEvents(events);
                setAllTasks(tasks);
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
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

        const tasksWithDeadlines = allTasks.filter(task => {
            if (!task.due_date || task.status === 'done' || task.status === 'cancelled') {
                return false;
            }
            const deadline = new Date(task.due_date);
            const today = new Date();
            return deadline >= today;
        });

        return tasksWithDeadlines
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 3);
    };

    const getUrgentDeadlinesCount = () => {
        if (!allTasks || allTasks.length === 0) return 0;

        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        return allTasks.filter(task => {
            if (!task.due_date || task.status === 'done' || task.status === 'cancelled') {
                return false;
            }

            const deadline = new Date(task.due_date);
            const isUrgentPriority = task.priority === 'urgent' || task.priority === 'high';
            const isNearDeadline = deadline <= threeDaysLater && deadline >= today;

            return isUrgentPriority && isNearDeadline;
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
                    <section className="main__top-section">
                        <div className="main__top-section-header">
                            <h1 className="main__h1 h1">Добрый день, Николай!</h1>
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
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="widgets__card shadow-glass">
                            <div className="widgets__card-header-section">
                                <h2 className="widgets__card-header">Срочные дедлайны</h2>
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
                                            urgencyLevel = 'work'; 
                                        } else if (daysUntil <= 7) {
                                            deadlineText = `Через ${daysUntil} дней`;
                                            urgencyLevel = 'notes';
                                        } else {
                                            deadlineText = formatDate(task.due_date);
                                            urgencyLevel = 'notes';
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