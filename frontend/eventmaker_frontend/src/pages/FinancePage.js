import { Header } from "../components/Header"
import { MobileHeader } from "../components/MobileHeader"
import { FinancePopUp } from "../components/FinancePopUp";
import eventAPI from "../api";
import { useState, useEffect } from "react";

export function FinancePage() {
    const [isOpen, setIsOpen] = useState(false);
    const [dataFinances, setDataFinances] = useState([]);
    const [events, setEvents] = useState({}); 
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [eventBudgets, setEventBudgets] = useState([]); 

    const fetchFinances = async () => {
        try {
            const response = await eventAPI.getMyFinances();
            return response || [];
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    const fetchEvents = async () => {
        try {
            const response = await eventAPI.getAllEvents();
            const eventMap = {};
            response.forEach(event => {
                eventMap[event.id] = event.title;
            });
            return eventMap;
        } catch (error) {
            console.log(error);
            return {};
        }
    }

    const calculateEventBudgets = (finances, events) => {
        const eventTotals = {};
        
        finances.forEach(transaction => {
            const eventId = transaction.event;
            const eventName = events[eventId] || `Событие ${eventId}`;
            const amount = parseFloat(transaction.amount) || 0;
            
            if (!eventTotals[eventId]) {
                eventTotals[eventId] = {
                    id: eventId,
                    name: eventName,
                    income: 0,
                    expense: 0,
                    total: 0
                };
            }
            
            if (transaction.type === 'income') {
                eventTotals[eventId].income += amount;
                eventTotals[eventId].total += amount;
            } else if (transaction.type === 'expense') {
                eventTotals[eventId].expense += amount;
                eventTotals[eventId].total -= amount;
            }
        });
        
        return Object.values(eventTotals)
            .sort((a, b) => b.total - a.total);
    };

    const calculateTotals = (finances) => {
        let income = 0;
        let expense = 0;
        
        finances.forEach(transaction => {
            const amount = parseFloat(transaction.amount) || 0;
            if (transaction.type === 'income') {
                income += amount;
            } else if (transaction.type === 'expense') {
                expense += amount;
            }
        });
        
        return { income, expense, total: income - expense };
    };


    useEffect(() => {
        const loadData = async () => {
            try {
                const finances = await fetchFinances();
                const eventMap = await fetchEvents();
                
                setDataFinances(finances);
                setEvents(eventMap);
                
                const totals = calculateTotals(finances);
                setTotalIncome(totals.income);
                setTotalExpense(totals.expense);
                
                const budgets = calculateEventBudgets(finances, eventMap);
                setEventBudgets(budgets);
                
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            }
        };
        loadData();
    }, []);

    const loadFinances = async () => {
        try {
            const finances = await fetchFinances();
            const eventMap = await fetchEvents();
            
            setDataFinances(finances);
            setEvents(eventMap);
            
            const totals = calculateTotals(finances);
            setTotalIncome(totals.income);
            setTotalExpense(totals.expense);
            
            const budgets = calculateEventBudgets(finances, eventMap);
            setEventBudgets(budgets);
            
        } catch (error) {
            console.log(error);
        }
    };

    const handleClicker = () => {
        setIsOpen(true);
    }

    const handleFinanceCreated = () => {
        loadFinances();
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const [year, month, day] = dateString.split('-');
            return `${day}.${month}.${year}`;
        } catch {
            return dateString;
        }
    };

    const formatAmount = (amount) => {
        if (!amount) return '0';
        return new Intl.NumberFormat('ru-RU').format(amount);
    };

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
                            <button className="main__top-section-btn create-event-btn" onClick={handleClicker}>
                                + Новая транзакция
                            </button>
                        </div>
                    </section>
                    
                    <section className="widgets__finance widgets">
                        <div className="widgets__finance-budgets">
                            <div className="widgets__finance-total-budget budgets shadow-glass">
                                <div className="budget__header">Общий баланс</div>
                                <div className={`budget__sum ${totalIncome - totalExpense >= 0 ? 'green' : 'red'}`}>
                                    {formatAmount(totalIncome - totalExpense)} ₽
                                </div>
                                <div className="budget__info">
                                    Доходы: {formatAmount(totalIncome)} ₽
                                </div>
                            </div>
                            <div className="widgets__finance-expenses budgets shadow-glass">
                                <div className="budget__header">Расходы</div>
                                <div className="budget__sum red">{formatAmount(totalExpense)} ₽</div>
                                <div className="budget__info">
                                    {dataFinances.length > 0 
                                        ? `${dataFinances.filter(t => t.type === 'expense').length} транзакций` 
                                        : 'Нет транзакций'}
                                </div>
                            </div>
                            <div className="widgets__finance-income budgets shadow-glass">
                                <div className="budget__header">Доходы</div>
                                <div className="budget__sum green">{formatAmount(totalIncome)} ₽</div>
                                <div className="budget__info">
                                    {dataFinances.length > 0 
                                        ? `${dataFinances.filter(t => t.type === 'income').length} транзакций` 
                                        : 'Нет транзакций'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="widgets__finance-summary shadow-glass">
                            <h2 className="widgets__finance-summary-header">Бюджеты по мероприятиям</h2>
                            <div className="widgets__finance-summary-list">
                                {eventBudgets.length > 0 ? (
                                    eventBudgets.map((event, index) => {
                                        const dotColors = ['blue-dot', 'green-dot', 'orange-dot'];
                                        const dotClass = dotColors[index % dotColors.length];
                                        
                                        return (
                                            <div className="summary-list__item" key={event.id}>
                                                <div className={`summary-list__item-color ${dotClass}`}></div>
                                                <div className="summary-list__item-name">{event.name}</div>
                                                <div className={`summary-list__item-budget ${event.total >= 0 ? 'green' : 'red'}`}>
                                                    {formatAmount(Math.abs(event.total))} ₽
                                                    <div className="budget-details">
                                                        <small>+{formatAmount(event.income)} / -{formatAmount(event.expense)}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="no-budgets-message">
                                        <p>Нет данных по мероприятиям</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="widgets__finance-transactions shadow-glass">
                            <div className="transactions-header-section">
                                <h2 className="widgets__finance-transactions-header">
                                    Последние транзакции
                                    <span className="transactions-count">
                                        ({dataFinances.length})
                                    </span>
                                </h2>
                                {dataFinances.length > 0 && (
                                    <div className="transactions-stats">
                                        <span className="stats-income">Доходы: {formatAmount(totalIncome)} ₽</span>
                                        <span className="stats-expense">Расходы: {formatAmount(totalExpense)} ₽</span>
                                    </div>
                                )}
                            </div>

                            <div className="table-wrapper">
                                {dataFinances.length > 0 ? (
                                    <table className="finance-transactions-table">
                                        <thead>
                                            <tr className="table__header-row">
                                                <th className="table__item-header">Дата</th>
                                                <th className="table__item-header">Событие</th>
                                                <th className="table__item-header">Описание</th>
                                                <th className="table__item-header last-summa">Сумма</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dataFinances.map(el => {
                                                const eventName = events[el.event] || `Событие ${el.event}`;
                                                return (
                                                    <tr className="table__list-row" key={el.id}>
                                                        <td className="table__item table-date-section">
                                                            {formatDate(el.date)}
                                                        </td>
                                                        <td className="table__item table-event-section">
                                                            {eventName}
                                                        </td>
                                                        <td className="table__item table-description-section">
                                                            {el.description || '-'}
                                                        </td>
                                                        <td className={`table__item table-finance-section 
                                                            ${el.type === 'expense' ? 'red' : 'green'}`}>
                                                            {el.type === 'expense' ? '-' : '+'}
                                                            {formatAmount(el.amount)} ₽
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="no-transactions-message">
                                        <p>Транзакций пока нет</p>
                                        <button 
                                            className="add-first-transaction"
                                            onClick={handleClicker}
                                        >
                                            Создать первую транзакцию
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <MobileHeader />
            {isOpen && <FinancePopUp setIsOpen={setIsOpen} onFinanceCreated={handleFinanceCreated} />}
        </>
    );
}