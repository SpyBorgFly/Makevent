import { Header } from "../components/Header"
import { MobileHeader } from "../components/MobileHeader"
import { FinancePopUp } from "../components/FinancePopUp";
import { useState } from "react";

export function FinancePage() {
    const [isOpen, setIsOpen] = useState(false);

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
                            <h1 className="main__h1 h1-notes">Финансы</h1>
                        </div>
                        <div className="main__top-section-button">
                            <button className="main__top-section-btn create-event-btn" onClick={handleClicker}>+ Новая транзакция</button>
                        </div>
                    </section>
                    <section className="widgets__finance widgets">
                        <div className="widgets__finance-budgets">
                            <div className="widgets__finance-total-budget budgets shadow-glass">
                                <div className="budget__header">Всего по проектам</div>
                                <div className="budget__sum">3 265 000 ₽</div>
                                <div className="budget__percents green">+12% за месяц</div>
                            </div>
                            <div className="widgets__finance-expenses budgets shadow-glass">
                                <div className="budget__header">Расходы</div>
                                <div className="budget__sum red">1 980 000 ₽</div>
                                <div className="budget__percents red">-8% за месяц</div>
                            </div>
                            <div className="widgets__finance-income budgets shadow-glass">
                                <div className="budget__header">Доходы</div>
                                <div className="budget__sum green">2 370 000 ₽</div>
                                <div className="budget__percents green">+16% за месяц</div>
                            </div>
                        </div>
                        <div className="widgets__finance-summary shadow-glass">
                            <h2 className="widgets__finance-summary-header">Бюджеты по мероприятиям</h2>
                            <div className="widgets__finance-summary-list">
                                <div className="summary-list__item">
                                    <div className="summary-list__item-color blue-dot"></div>
                                    <div className="summary-list__item-name">Сессия партнеров</div>
                                    <div className="summary-list__item-budget">1 200 000 ₽</div>
                                </div>
                                <div className="summary-list__item">
                                    <div className="summary-list__item-color green-dot"></div>
                                    <div className="summary-list__item-name">Весенний вебинар</div>
                                    <div className="summary-list__item-budget">320 000 ₽</div>
                                </div>
                                <div className="summary-list__item">
                                    <div className="summary-list__item-color orange-dot"></div>
                                    <div className="summary-list__item-name">Team Building 2024</div>
                                    <div className="summary-list__item-budget">Не определен</div>
                                </div>
                            </div>
                        </div>
                        <div className="widgets__finance-transactions shadow-glass">
                            <h2 className="widgets__finance-transactions-header">Последние транзакции</h2>

                            <div className="table-wrapper">
                                <table className="finance-transactions-table">
                                    <thead>
                                        <tr className="table__header-row">
                                            <th className="table__item-header">Дата</th>
                                            <th className="table__item-header">Событие</th>
                                            <th className="table__item-header">Описание</th>
                                            <th className="table__item-header">Сумма</th>
                                            <th className="table__item-header">Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="table__list-row">
                                            <td className="table__item table-date-section">22.03.2024</td>
                                            <td className="table__item table-event-section">Сессия партнеров</td>
                                            <td className="table__item table-description-section">Оплата площадки</td>
                                            <td className="table__item table-finance-section red">-350 000 ₽</td>
                                            <td className="table__item table-status-section">
                                                <div className="status-with-dot">
                                                    <span className="status-dot blue-dot"></span>
                                                    <span className="status-text">Проведено</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="table__list-row">
                                            <td className="table__item table-date-section">20.03.2024</td>
                                            <td className="table__item table-event-section">Весенний вебинар</td>
                                            <td className="table__item table-description-section">Поступление спонсорских</td>
                                            <td className="table__item table-finance-section green">+120 000 ₽</td>
                                            <td className="table__item table-status-section">
                                                <div className="status-with-dot">
                                                    <span className="status-dot green-dot"></span>
                                                    <span className="status-text">Проведено</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="table__list-row">
                                            <td className="table__item table-date-section">18.03.2024</td>
                                            <td className="table__item table-event-section">Team Building 2024</td>
                                            <td className="table__item table-description-section">Бронирование транспорта</td>
                                            <td className="table__item table-finance-section red">-45 000 ₽</td>
                                            <td className="table__item table-status-section">
                                                <div className="status-with-dot">
                                                    <span className="status-dot orange-dot"></span>
                                                    <span className="status-text">В ожидании</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <MobileHeader />
            {isOpen && <FinancePopUp setIsOpen={setIsOpen}/>}
        </>
    );
}