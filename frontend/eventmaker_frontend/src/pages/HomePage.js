import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import eventAPI from "../api";
import { useEffect, useState } from "react";

export function HomePage() {
    const [dataEvents, setDataEvents] = useState([]);

    const fetchData = async () => {
        const response = await eventAPI.getAllEvents();
        setDataEvents(response.data)
    }

    useEffect(() => {
        fetchData();
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
                            <span className="main__top-section-text-2">{dataEvents ? dataEvents.length : 0} мероприятий</span>
                        </div>
                        <div className="main__top-section-event-boxes">
                            <div className="main__top-section-event-box shadow-glass">
                                <span className="main__top-section-event-box-count in-progress">2</span>
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
                                <a href="#" className="widgets__card-header-link">Все</a>
                            </div>
                            <div className="widgets__card-event-list">
                                <a href="#" className="widgets__card-event shadow-glass">
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
                                </a>
                                <a href="#" className="widgets__card-event shadow-glass">
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
                                </a>
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