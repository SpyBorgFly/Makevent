import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";

export function EventsPage() {
    const [isOpen, setIsOpen] = useState(false);

    const popUpWindow = () => {
        return (
            <div className="popup-overlay">
                <div className="popup-form">
                    <div className="popup-form__header">
                        <div className="popup-form__header-section">
                            <h1 className="popup-form__header-h">
                                Создать событие
                            </h1>
                            <div className="popup-form__close-button">
                                <button onClick={() => setIsOpen(false)} className="close-button">&#10006;</button>
                            </div>
                        </div>
                        <div className="popup-form__name-section">
                            <div className="popup-form__name-section-header popup-headers">Название</div>
                            <input type="text" className="popup-form__name-section-input" required placeholder="Введите название события" />
                        </div>
                        <div className="popup-form__data-section">
                            <div className="popup-form__date-section-header popup-headers">Дата</div>
                            <input type="text" className="popup-form__date-section-input" required placeholder="Введите название события" />
                        </div>
                        <div className="popup-form__time-section">
                            <div className="popup-form__time-section-header popup-headers">Время</div>
                            <input type="text" className="popup-form__time-section-input" required placeholder="Введите название события" />
                        </div>
                        <div className="popup-form__description-section">
                            <div className="popup-form__description-section-header popup-headers">Описание</div>
                            <input type="text" className="popup-form__description-section-input" required placeholder="Коротко опишите мероприятие" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            {isOpen && popUpWindow()}
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