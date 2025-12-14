import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import { PopUpWindow } from "../components/PopUpWindow";
import eventAPI from "../api";
import { Link } from "react-router";

export function EventsPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [dataEvents, setDataEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [eventsWithProgress, setEventsWithProgress] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await eventAPI.getAllEvents();
            return response;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    const fetchTasksForEvent = async (eventId) => {
        try {
            const response = await eventAPI.getMyTasksByEvent(eventId);
            return response || [];
        } catch (error) {
            return [];
        }
    };

    const calculateProgress = (event, tasks) => {
        if (event.status === 'planned' || event.status === 'cancelled') {
            return {
                percentage: 0,
                completedTasks: 0,
                totalTasks: 0,
                showProgress: false
            };
        }
        
        if (event.status === 'completed' || event.status === 'done') {
            return {
                percentage: 100,
                completedTasks: tasks.length,
                totalTasks: tasks.length,
                showProgress: true
            };
        }
        
        const totalTasks = tasks.length;
        
        if (totalTasks === 0) {
            return {
                percentage: 0,
                completedTasks: 0,
                totalTasks: 0,
                showProgress: true
            };
        }
        
        const completedTasks = tasks.filter(task => task.status === 'done').length;
        
        const percentage = Math.round((completedTasks / totalTasks) * 100);
        
        return {
            percentage,
            completedTasks,
            totalTasks,
            showProgress: true
        };
    };

    const getEventStatusText = (status) => {
        switch (status) {
            case 'planned': return 'Планируется';
            case 'in_progress': return 'В работе';
            case 'completed': return 'Завершено';
            case 'done': return 'Завершено';
            case 'cancelled': return 'Отменено';
            default: return status;
        }
    };

    const getEventStatusColor = (status) => {
        switch (status) {
            case 'planned': return 'error';
            case 'in_progress': return 'work';
            case 'completed': 
            case 'done': return 'notes';
            case 'cancelled': return 'cancelled';
            default: return 'work';
        }
    };

    const loadEvents = async () => {
        setLoading(true);
        try {
            const events = await eventAPI.getAllEvents();
            
            const eventsWithTasks = await Promise.all(
                events.map(async (event) => {
                    const tasks = await fetchTasksForEvent(event.id);
                    const progress = calculateProgress(event, tasks);
                    
                    return {
                        ...event,
                        progress,
                        tasks,
                        originalEventType: event.event_type, // сохраняем оригинальный тип
                        statusText: getEventStatusText(event.status), // русский текст статуса
                        statusColor: getEventStatusColor(event.status) // цвет статуса
                    };
                })
            );
            
            setDataEvents(eventsWithTasks);
            setFilteredEvents(eventsWithTasks);
            setEventsWithProgress(eventsWithTasks);
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (!searchTerm || searchTerm.trim() === "") {
            setFilteredEvents(eventsWithProgress);
        } else {
            const searchLower = searchTerm.toLowerCase();
            const filtered = eventsWithProgress.filter(event =>
                event.title && event.title.toLowerCase().includes(searchLower)
            );
            setFilteredEvents(filtered);
        }
    }, [searchTerm, eventsWithProgress]);

    useEffect(() => {
        let result = eventsWithProgress;

        if (statusFilter) {
            if (statusFilter === 'planning') {
                result = result.filter(event => event.status === 'planned');
            } else if (statusFilter === 'in-progress') {
                result = result.filter(event => event.status === 'in_progress');
            } else if (statusFilter === 'ended') {
                result = result.filter(event => event.status === 'completed' || event.status === 'done');
            } else if (statusFilter === 'canceled') {
                result = result.filter(event => event.status === 'cancelled');
            }
        }

        if (typeFilter) {
            result = result.filter(event => {
                if (!event.originalEventType) return false;
                const eventTypeLower = event.originalEventType.toLowerCase();
                const filterLower = typeFilter.toLowerCase();
                
                const typeMap = {
                    'конференция': ['конференция', 'conference'],
                    'тимбилдинг': ['тимбилдинг', 'teambuilding', 'team-building'],
                    'вебинар': ['вебинар', 'webinar']
                };
                
                // Если фильтр есть в мапе, проверяем все варианты
                if (typeMap[filterLower]) {
                    return typeMap[filterLower].includes(eventTypeLower);
                }
                
                return eventTypeLower === filterLower;
            });
        }

        setFilteredEvents(result);
    }, [statusFilter, typeFilter, eventsWithProgress]);

    const handleEventCreated = () => {
        loadEvents();
    };

    const handleClicker = () => {
        setIsOpen(true);
    }

    const ProgressBar = ({ percentage, showProgress, completedTasks, totalTasks }) => {
        
        if (!showProgress) {
            return (
                <div className="widgets__event-card-bar">
                    <div className="progress-bar-empty">
                        <span className="progress-bar-empty-text">Прогресс не доступен</span>
                    </div>
                    <div className="progress-percentage">—</div>
                </div>
            );
        }

        const width = Math.min(Math.max(percentage, 0), 100);
        
        return (
            <div className="widgets__event-card-bar">
                <div className="progress-bar-wrapper">
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar-fill"
                            style={{ width: `${width}%` }}
                        ></div>
                    </div>
                    <div className="progress-info">
                        <div className="progress-stats">
                            {completedTasks} из {totalTasks} задач
                        </div>
                        <div className="progress-percentage">
                            {percentage}%
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const getUniqueEventTypes = () => {
        const types = new Set();
        
        eventsWithProgress.forEach(event => {
            if (event.originalEventType) {
                types.add(event.originalEventType.toLowerCase());
            }
        });
        
        return Array.from(types).map(type => {
            let label = type;
            if (type === 'conference') label = 'Конференция';
            else if (type === 'webinar') label = 'Вебинар';
            else if (type === 'teambuilding' || type === 'team-building') label = 'Тимбилдинг';
            else if (type === 'конференция') label = 'Конференция';
            else if (type === 'вебинар') label = 'Вебинар';
            else if (type === 'тимбилдинг') label = 'Тимбилдинг';
            
            return {
                value: type,
                label: label
            };
        }).sort((a, b) => a.label.localeCompare(b.label));
    };

    const uniqueEventTypes = getUniqueEventTypes();

    const displayEventType = (type) => {
        if (!type) return 'Не указано';
        
        const typeMap = {
            'conference': 'Конференция',
            'webinar': 'Вебинар',
            'teambuilding': 'Тимбилдинг',
            'team-building': 'Тимбилдинг',
            'конференция': 'Конференция',
            'вебинар': 'Вебинар',
            'тимбилдинг': 'Тимбилдинг'
        };
        
        return typeMap[type.toLowerCase()] || type;
    };

    return (
        <>
            <Header />
            <main className="main">
                <div className="main__container">
                    <div className="main__top-section">
                        <div className="main__top-section-header">
                            <h1 className="main__h1 h1-notes">Мероприятия</h1>
                        </div>
                        <div className="main__top-section-button">
                            <button onClick={handleClicker} className="main__top-section-btn create-event-btn">
                                + Создать ивент
                            </button>
                            {isOpen && <PopUpWindow setIsOpen={setIsOpen} onEventCreated={handleEventCreated} />}
                        </div>
                    </div>
                    
                    <section className="widgets">
                        <div className="widgets__card events-page-widgets shadow-glass">
                            <div className="widgets__filter-section">
                                <div className="widgets__filter-section-selects">
                                    <select
                                        name="status-filter"
                                        className="widgets__filter"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">Все статусы</option>
                                        <option value="planning">Планируется</option>
                                        <option value="in-progress">В работе</option>
                                        <option value="ended">Завершено</option>
                                        <option value="canceled">Отменено</option>
                                    </select>
                                    <select
                                        name="type-filter"
                                        className="widgets__filter"
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                    >
                                        <option value="">Все типы</option>
                                        {uniqueEventTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    className="find-event"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Поиск по названию"
                                />
                            </div>

                            <div className="search-results-info">
                                <span>Найдено событий: {filteredEvents.length}</span>
                                {(searchTerm || statusFilter || typeFilter) && (
                                    <button 
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStatusFilter("");
                                            setTypeFilter("");
                                        }}
                                        className="clear-filters-btn"
                                    >
                                        Сбросить фильтры
                                    </button>
                                )}
                            </div>

                            <div className="widgets__events-section">
                                {loading ? (
                                    <div className="loading-message">Загрузка...</div>
                                ) : filteredEvents.length > 0 ? (
                                    filteredEvents.map((el) => {
                                        const date = new Date(el.event_day);
                                        const timeString = el.event_time || "00:00:00";
                                        const dayOfDate = date.getDate();

                                        const [hours, minutes] = timeString.split(':');
                                        const monthNames = [
                                            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                                            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
                                        ];
                                        const monthName = monthNames[date.getMonth()];

                                        return (
                                            <Link to={`/events/${el.id}`} key={el.id} className="widgets__event-card shadow-glass">
                                                <div className="widgets__event-card-status">
                                                    <span className={`card-event-status ${el.statusColor}`}>
                                                        {el.statusText}
                                                    </span>
                                                    <span className="card-event-description__datetime widgets__date">
                                                        {dayOfDate} {monthName}, {hours}:{minutes}
                                                    </span>
                                                </div>
                                                <h2 className="widgets__event-card-header">{el.title}</h2>
                                                
                                                <ProgressBar 
                                                    percentage={el.progress.percentage}
                                                    showProgress={el.progress.showProgress}
                                                    completedTasks={el.progress.completedTasks}
                                                    totalTasks={el.progress.totalTasks}
                                                />
                                                
                                                <div className="widgets__event-card-type">
                                                    Тип: <strong>{displayEventType(el.originalEventType)}</strong>
                                                </div>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <div className="no-events-message">
                                        {eventsWithProgress.length === 0 
                                            ? "Событий пока нет" 
                                            : "События по вашему запросу не найдены"
                                        }
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