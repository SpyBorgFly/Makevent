import { Link } from "react-router";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";

export function NotesPage() {
    return (
        <>
            <Header />
            <main class="main">
                <div class="main__container">
                    <section class="main__top-section">
                        <div class="main__top-section-header">
                            <h1 class="main__h1 h1-notes">Заметки</h1>
                        </div>
                        <div class="main__top-section-button">
                            <button class="main__top-section-btn create-event-btn">+ Новая заметка</button>
                        </div>
                    </section>
                    <section class="notes-widgets">
                        <Link to="#" class="notes-widgets__widget shadow-glass">
                            <div class="notes-widgets__datetime">18 марта, 15:20</div>
                            <h2 class="notes-widgets__widget-header">Идеи для welcome-зоны</h2>
                            <div class="notes-widgets__widget-description">Добавить интерактивную фотозону с фирменным
                                брендингом. Рассмотреть партнёрство с кофейней для welcome-drink.
                            </div>
                            <div class="notes-widgets__widget-tags">
                                <span class="tag card-event-status work">Сессия партнеров</span>
                                <span class="tag card-event-status notes">Идея</span>
                            </div>
                        </Link>
                        <Link to="#" class="notes-widgets__widget shadow-glass">
                            <div class="notes-widgets__datetime">14 марта, 10:10</div>
                            <h2 class="notes-widgets__widget-header">Список важных гостей</h2>
                            <div class="notes-widgets__widget-description">Проверить подтверждения от VIP-партнёров. Подготовить
                                отдельные бейджи и welcome-пакеты.
                            </div>
                            <div class="notes-widgets__widget-tags">
                                <span class="tag card-event-status error">Весенний вебинар</span>
                                <span class="tag card-event-status work">Контроль</span>
                            </div>
                        </Link>
                    </section>
                </div>
            </main>
            <MobileHeader />
        </>
    );
}