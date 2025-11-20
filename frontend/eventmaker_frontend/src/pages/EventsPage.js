import { useState } from "react";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import { PopUpWindow } from "../components/PopUpWindow";

export function EventsPage() {
    const [isOpen, setIsOpen] = useState(false);

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
                            {isOpen && <PopUpWindow setIsOpen={setIsOpen} />}
                        </div>
                    </div>
                    <section className="widgets">
                        <div className="widgets__card events-page-widgets shadow-glass">
                            <div className="widgets__filter-section">
                                <div className="widgets__filter-section-selects">
                                    <select name="status-filter" id="1" className="widgets__filter">
                                        <option value="" className="option-selector">Все статусы</option>
                                        <option value="in-progress" className="option-selector">В работе</option>
                                        <option value="ended" className="option-selector">Завершен</option>
                                        <option value="planning" className="option-selector">Планируется</option>
                                        <option value="canceled" className="option-selector">Отменен</option>
                                    </select>
                                    <select name="type-filter" id="2" className="widgets__filter">
                                        <option value="" className="option-selector">Все типы</option>
                                        <option value="conference" className="option-selector">Конференция</option>
                                        <option value="team-building" className="option-selector">Тимбилдинг</option>
                                        <option value="webinar" className="option-selector">Вебинар</option>
                                    </select>
                                </div>
                                <input type="text" className="find-event" required placeholder="Поиск по названию" />
                            </div>
                            <div className="widgets__events-section">
                                <a href="#" className="widgets__event-card shadow-glass">
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
                                </a>
                                <a href="#" className="widgets__event-card shadow-glass">
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
                                </a>
                                <a href="#" className="widgets__event-card shadow-glass">
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
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <MobileHeader />
        </>
    );
}