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

    const fetchData = async () => {
        try {
            const response = await eventAPI.getAllEvents();
            return response;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    const loadEvents = async () => {
        try {
            const data = await eventAPI.getAllEvents();
            setDataEvents(data);
            setFilteredEvents(data);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchData();
            setDataEvents(data);
            setFilteredEvents(data);
        };
        loadData();
    }, [])

    useEffect(() => {
        if (!searchTerm || searchTerm.trim() === "") {
            setFilteredEvents(dataEvents);
        } else {
            const searchLower = searchTerm.toLowerCase();
            const filtered = dataEvents.filter(event =>
                event.title && event.title.toLowerCase().includes(searchLower)
            );
            setFilteredEvents(filtered);
        }
    }, [searchTerm, dataEvents]);

    const handleEventCreated = () => {
        loadEvents();
    };

    const handleClicker = () => {
        setIsOpen(true);
    }

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
                            <button onClick={handleClicker} className="main__top-section-btn create-event-btn">+ Создать ивент</button>
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
                                        <option value="" className="option-selector">Все статусы</option>
                                        <option value="in-progress" className="option-selector">В работе</option>
                                        <option value="ended" className="option-selector">Завершен</option>
                                        <option value="planning" className="option-selector">Планируется</option>
                                        <option value="canceled" className="option-selector">Отменен</option>
                                    </select>
                                    <select
                                        name="type-filter"
                                        className="widgets__filter"
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                    >
                                        <option value="" className="option-selector">Все типы</option>
                                        <option value="conference" className="option-selector">Конференция</option>
                                        <option value="team-building" className="option-selector">Тимбилдинг</option>
                                        <option value="webinar" className="option-selector">Вебинар</option>
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    className="find-event"
                                    required
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Поиск по названию"
                                />
                            </div>


                            <div className="widgets__events-section">
                                {filteredEvents.map((el) => {
                                    const date = new Date(el.event_day);
                                    const timeString = el.event_time;
                                    const dayOfDate = date.getDate();

                                    const [hours, minutes, seconds] = timeString.split(':');
                                    console.log()
                                    const monthNames = [
                                        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                                        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
                                    ];
                                    const monthName = monthNames[date.getMonth()];

                                    return (
                                        <Link to={`/events/${el.id}`} key={el.id} className="widgets__event-card shadow-glass">
                                            <div className="widgets__event-card-status">
                                                <span className={`card-event-status ${el.status === 'planned' ? 'error' : ''}`}>
                                                    {el.status === 'planned' ? 'Планируется' : ''}
                                                </span>
                                                <span className="card-event-description__datetime widgets__date">
                                                    {dayOfDate} {monthName}, {hours}:{minutes}
                                                </span>
                                            </div>
                                            <h2 className="widgets__event-card-header">{el.title}</h2>
                                            <div className="widgets__event-card-bar">
                                                <div className="progress-bar">-------------------------</div>
                                                <div className="success-percent">0%</div>
                                            </div>
                                            <div className="widgets__event-card-budget">Бюджет: <strong>1 200 000 ₽</strong></div>
                                        </Link>
                                    );
                                })}

                                {filteredEvents.length === 0 && dataEvents.length === 0 && (
                                    <>
                                        <Link to="#" className="widgets__event-card shadow-glass">
                                            <div className="widgets__event-card-status">
                                                <span className="card-event-status work">В работе</span>
                                                <span className="card-event-description__datetime widgets__date">23 марта, 12:00</span>
                                            </div>
                                            <h2 className="widgets__event-card-header">Сессия партнеров</h2>
                                            <div className="widgets__event-card-bar">
                                                <div className="progress-bar">-------------------------</div>
                                                <div className="success-percent">70%</div>
                                            </div>
                                            <div className="widgets__event-card-budget">Бюджет: <strong>1 200 000 ₽</strong></div>
                                        </Link>
                                        <Link to="#" className="widgets__event-card shadow-glass">
                                            <div className="widgets__event-card-status">
                                                <span className="card-event-status notes">Завершен</span>
                                                <span className="card-event-description__datetime widgets__date">15 марта, 10:00</span>
                                            </div>
                                            <h2 className="widgets__event-card-header">Весенний вебинар</h2>
                                            <div className="widgets__event-card-bar">
                                                <div className="progress-bar">-------------------------</div>
                                                <div className="success-percent">100%</div>
                                            </div>
                                            <div className="widgets__event-card-budget">Бюджет: <strong>1 200 000 ₽</strong></div>
                                        </Link>
                                        <Link to="#" className="widgets__event-card shadow-glass">
                                            <div className="widgets__event-card-status">
                                                <span className="card-event-status error">Планируется</span>
                                                <span className="card-event-description__datetime widgets__date">7 апреля, 16:00</span>
                                            </div>
                                            <h2 className="widgets__event-card-header">Тимбилдинг 2024</h2>
                                            <div className="widgets__event-card-bar">
                                                <div className="progress-bar">-------------------------</div>
                                                <div className="success-percent">100%</div>
                                            </div>
                                            <div className="widgets__event-card-budget">Бюджет: <strong>1 200 000 ₽</strong></div>
                                        </Link>
                                    </>
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