import { Link } from "react-router";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import { NotePopUp } from "../components/NotePopUp";
import eventAPI from "../api";
import { useState, useEffect } from "react";

export function NotesPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [dataNotes, setDataNotes] = useState([]);

    const fetchData = async () => {
        try {
            const response = await eventAPI.getAllNotes();
            return response;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchData();
            setDataNotes(data)
        };
        loadData();
    }, [])


    const handleClicker = () => {
        setIsOpen(true);
    }

    return (
        <>
            <Header />
            <main className="main">
                <div className="main__container">
                    <section className="main__top-section">
                        <div className="main__top-section-header">
                            <h1 className="main__h1 h1-notes">Заметки</h1>
                        </div>
                        <div className="main__top-section-button">
                            <button className="main__top-section-btn create-event-btn" onClick={handleClicker}>+ Новая заметка</button>
                        </div>
                    </section>
                    <section className="notes-widgets">
                        <Link to="#" className="notes-widgets__widget shadow-glass">
                            <div className="notes-widgets__datetime">18 марта, 15:20</div>
                            <h2 className="notes-widgets__widget-header">Идеи для welcome-зоны</h2>
                            <div className="notes-widgets__widget-description">Добавить интерактивную фотозону с фирменным
                                брендингом. Рассмотреть партнёрство с кофейней для welcome-drink.
                            </div>
                            <div className="notes-widgets__widget-tags">
                                <span className="tag card-event-status work">Сессия партнеров</span>
                                <span className="tag card-event-status notes">Идея</span>
                            </div>
                        </Link>
                        <Link to="#" className="notes-widgets__widget shadow-glass">
                            <div className="notes-widgets__datetime">14 марта, 10:10</div>
                            <h2 className="notes-widgets__widget-header">Список важных гостей</h2>
                            <div className="notes-widgets__widget-description">Проверить подтверждения от VIP-партнёров. Подготовить
                                отдельные бейджи и welcome-пакеты.
                            </div>
                            <div className="notes-widgets__widget-tags">
                                <span className="tag card-event-status error">Весенний вебинар</span>
                                <span className="tag card-event-status work">Контроль</span>
                            </div>
                        </Link>
                        {dataNotes.map(el => {
                            return (
                                <Link to="#" className="notes-widgets__widget shadow-glass">
                                    <div className="notes-widgets__datetime">14 марта, 10:10</div>
                                    <h2 className="notes-widgets__widget-header">Список важных гостей</h2>
                                    <div className="notes-widgets__widget-description">Проверить подтверждения от VIP-партнёров. Подготовить
                                        отдельные бейджи и welcome-пакеты.
                                    </div>
                                    <div className="notes-widgets__widget-tags">
                                        <span className="tag card-event-status error">Весенний вебинар</span>
                                        <span className="tag card-event-status work">Контроль</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </section>
                </div>
            </main>
            <MobileHeader />
            {isOpen && <NotePopUp setIsOpen={setIsOpen} />}
        </>
    );
}