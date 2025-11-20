import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import eventAPI from "../api";
import { useEffect, useState } from "react";
import { Link } from "react-router";

export function HomePage() {
    const [dataEvents, setDataEvents] = useState([]);

    const fetchData = async () => {
        try {
            const response = await eventAPI.getAllEvents();
            return response;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchData();
            setDataEvents(data)
        };
        loadData();
    }, [])

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
                                <span className="main__top-section-event-box-count in-progress">{dataEvents.length}</span>
                                <span className="main__top-section-event-box-text">Ближайших события</span>
                            </div>
                            <div className="main__top-section-event-box shadow-glass">
                                <span className="main__top-section-event-box-count deadline">1</span>
                                <span className="main__top-section-event-box-text">Срочный дедлайн</span>
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
                                {dataEvents.map((el) => {
                                    const date = new Date(el.date);
                                    const dayOfDate = date.getDate();
                                    const hours = date.getHours();
                                    const minutes = date.getMinutes();
                                    const monthNames = [
                                        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                                        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
                                    ];
                                    const monthName = monthNames[date.getMonth()];

                                    return (
                                        <Link to={`/events/${el.id}`} key={el.id} className="widgets__card-event shadow-glass">
                                            <div className="card-event-date">
                                                <span className="card-event-date__day">{dayOfDate}</span>
                                                <span className="card-event-date__month">{monthName}</span>
                                            </div>
                                            <div className="card-event-description">
                                                <span className="card-event-description__header">{el.title}</span>
                                                <span className="card-event-description__datetime">{dayOfDate} {monthName}, 0{hours}:{minutes}0</span>
                                            </div>
                                            <div className="card-event-status work">
                                                В работе
                                            </div>
                                        </Link>
                                    );
                                })}
                                <Link to="#" className="widgets__card-event shadow-glass">
                                    <div className="card-event-date">
                                        <span className="card-event-date__day">23</span>
                                        <span className="card-event-date__month">марта</span>
                                    </div>
                                    <div className="card-event-description">
                                        <span className="card-event-description__header">Сессия партнеров</span>
                                        <span className="card-event-description__datetime">23 марта, 12:00</span>
                                    </div>
                                    <div className="card-event-status work">
                                        В работе
                                    </div>
                                </Link>
                                <Link to="#" className="widgets__card-event shadow-glass">
                                    <div className="card-event-date">
                                        <span className="card-event-date__day">25</span>
                                        <span className="card-event-date__month">марта</span>
                                    </div>
                                    <div className="card-event-description">
                                        <span className="card-event-description__header">Тимбилдинг</span>
                                        <span className="card-event-description__datetime">23 марта, 12:00</span>
                                    </div>
                                    <div className="card-event-status notes">
                                        Черновик
                                    </div>
                                </Link>
                            </div>
                        </div>
                        <div className="widgets__card shadow-glass">
                            <div className="widgets__card-header-section">
                                <h2 className="widgets__card-header">Срочные дедлайны</h2>
                                <a href="#" className="widgets__card-header-link">Перейти</a>
                            </div>
                            <div className="widgets__card-event-list">
                                <a href="#" className="widgets__card-event shadow-glass">
                                    <div className="card-event-date">
                                        <span className="card-event-date__day">23</span>
                                        <span className="card-event-date__month">марта</span>
                                    </div>
                                    <div className="card-event-description">
                                        <span className="card-event-description__header">Оплатить депозит</span>
                                        <span className="card-event-description__datetime">До завтра</span>
                                    </div>
                                    <div className="card-event-status work error">
                                        Срочно
                                    </div>
                                </a>
                                <a href="#" className="widgets__card-event shadow-glass">
                                    <div className="card-event-date">
                                        <span className="card-event-date__day">24</span>
                                        <span className="card-event-date__month">марта</span>
                                    </div>
                                    <div className="card-event-description">
                                        <span className="card-event-description__header">Подписать договор</span>
                                        <span className="card-event-description__datetime">До 24 марта</span>
                                    </div>
                                    <div className="card-event-status work">
                                        В работе
                                    </div>
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
                <button href="#" className="create-event-button shadow-glass">
                    <div className="plus-symbol">+</div>
                    <span className="create-event-text">Создать ивент</span>
                </button>
            </main>
            <MobileHeader />
        </>
    );
}