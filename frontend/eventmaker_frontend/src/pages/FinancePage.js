import { Header } from "../components/Header"
import { MobileHeader } from "../components/MobileHeader"
import { FinancePopUp } from "../components/FinancePopUp";
import eventAPI from "../api";
import { useState, useEffect, useMemo, useCallback } from "react";

export function FinancePage() {
    const [isOpen, setIsOpen] = useState(false);
    const [dataFinances, setDataFinances] = useState([]);
    const [events, setEvents] = useState({});
    const [eventList, setEventList] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [loading, setLoading] = useState(true);

    // Фильтры для отчета
    const [selectedEvent, setSelectedEvent] = useState("all");
    const [periodType, setPeriodType] = useState("month");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [customDateFrom, setCustomDateFrom] = useState("");
    const [customDateTo, setCustomDateTo] = useState("");

    // Инициализация дат для произвольного периода
    useEffect(() => {
        if (!customDateFrom) {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setCustomDateFrom(firstDay.toISOString().split('T')[0]);
            setCustomDateTo(today.toISOString().split('T')[0]);
        }
    }, []);

    // Загрузка всех данных
    const fetchFinances = useCallback(async () => {
        try {
            const response = await eventAPI.getMyFinances();
            return response || [];
        } catch (error) {
            console.log(error);
            return [];
        }
    }, []);

    const fetchEvents = useCallback(async () => {
        try {
            const response = await eventAPI.getAllEvents();
            const eventMap = {};
            const eventArray = [];

            response.forEach(event => {
                eventMap[event.id] = event.title;
                eventArray.push({
                    id: event.id,
                    title: event.title,
                    date: event.event_day
                });
            });

            eventArray.sort((a, b) => new Date(b.date) - new Date(a.date));

            return { eventMap, eventArray };
        } catch (error) {
            console.log(error);
            return { eventMap: {}, eventArray: [] };
        }
    }, []);

    // Загрузка отчета
    const fetchFinanceReport = useCallback(async () => {
        setLoadingReport(true);
        try {
            let params = { period: periodType };

            if (periodType === "month") {
                params.year = selectedYear;
                params.month = selectedMonth;
            } else if (periodType === "year") {
                params.year = selectedYear;
            } else if (periodType === "custom") {
                params.date_from = customDateFrom;
                params.date_to = customDateTo;
            }

            if (selectedEvent !== "all") {
                params.event_id = selectedEvent;
            }

            const response = await eventAPI.getFinanceReport(params);
            setReportData(response);

        } catch (error) {
            console.error("Ошибка загрузки отчета:", error);
            setReportData(null);
        } finally {
            setLoadingReport(false);
        }
    }, [periodType, selectedYear, selectedMonth, customDateFrom, customDateTo, selectedEvent]);

    // Функция для фильтрации транзакций по выбранному периоду
    const getTransactionsForPeriod = useCallback(() => {
        if (!dataFinances.length) return [];

        let filtered = [...dataFinances];

        // Фильтрация по событию
        if (selectedEvent !== "all") {
            filtered = filtered.filter(t => t.event == selectedEvent);
        }

        // Фильтрация по дате
        filtered = filtered.filter(transaction => {
            const transactionDate = new Date(transaction.date || transaction.created_at);

            if (periodType === "month") {
                const yearMatch = transactionDate.getFullYear() === selectedYear;
                const monthMatch = transactionDate.getMonth() + 1 === selectedMonth;
                return yearMatch && monthMatch;
            }

            if (periodType === "year") {
                return transactionDate.getFullYear() === selectedYear;
            }

            if (periodType === "custom" && customDateFrom && customDateTo) {
                const fromDate = new Date(customDateFrom);
                const toDate = new Date(customDateTo);
                fromDate.setHours(0, 0, 0, 0);
                toDate.setHours(23, 59, 59, 999);
                return transactionDate >= fromDate && transactionDate <= toDate;
            }

            return true;
        });

        return filtered;
    }, [dataFinances, selectedEvent, periodType, selectedYear, selectedMonth, customDateFrom, customDateTo]);

    // Рассчитать статистику по транзакциям за период
    const periodTransactionsStats = useMemo(() => {
        const transactions = getTransactionsForPeriod();

        const stats = {
            count: transactions.length,
            income: 0,
            expense: 0,
            incomeCount: 0,
            expenseCount: 0
        };

        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount) || 0;

            if (transaction.type === 'income') {
                stats.income += amount;
                stats.incomeCount++;
            } else {
                stats.expense += amount;
                stats.expenseCount++;
            }
        });

        return stats;
    }, [getTransactionsForPeriod]);

    // Общая загрузка данных
    const loadAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [finances, { eventMap, eventArray }] = await Promise.all([
                fetchFinances(),
                fetchEvents()
            ]);

            setDataFinances(finances);
            setEvents(eventMap);
            setEventList(eventArray);

            // Автоматически загружаем отчет по текущим фильтрам
            await fetchFinanceReport();

        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchFinances, fetchEvents, fetchFinanceReport]);

    // Инициализация
    useEffect(() => {
        loadAllData();
    }, []);

    // Обновление отчета при изменении фильтров
    useEffect(() => {
        if (!loading) {
            fetchFinanceReport();
        }
    }, [selectedEvent, periodType, selectedYear, selectedMonth, customDateFrom, customDateTo]);

    // Обработчик создания новой транзакции
    const handleFinanceCreated = useCallback(async () => {
        // 1. Обновляем общий список транзакций
        const freshFinances = await fetchFinances();
        setDataFinances(freshFinances);

        // 2. Обновляем отчет
        await fetchFinanceReport();
    }, [fetchFinances, fetchFinanceReport]);

    // Вычисляемые значения для общих виджетов
    const { totalIncome, totalExpense, eventBudgets } = useMemo(() => {
        let income = 0;
        let expense = 0;
        const eventTotals = {};

        dataFinances.forEach(transaction => {
            const amount = parseFloat(transaction.amount) || 0;

            if (transaction.type === 'income') {
                income += amount;
            } else {
                expense += amount;
            }

            const eventId = transaction.event;
            if (eventId) {
                if (!eventTotals[eventId]) {
                    eventTotals[eventId] = {
                        id: eventId,
                        name: events[eventId] || `Событие ${eventId}`,
                        income: 0,
                        expense: 0,
                        total: 0
                    };
                }

                if (transaction.type === 'income') {
                    eventTotals[eventId].income += amount;
                    eventTotals[eventId].total += amount;
                } else {
                    eventTotals[eventId].expense += amount;
                    eventTotals[eventId].total -= amount;
                }
            }
        });

        const budgets = Object.values(eventTotals)
            .sort((a, b) => b.total - a.total);

        return { totalIncome: income, totalExpense: expense, eventBudgets: budgets };
    }, [dataFinances, events]);

    // Последние транзакции для таблицы
    const recentTransactions = useMemo(() => {
        return [...dataFinances]
            .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
            .slice(0, 10);
    }, [dataFinances]);

    // Вспомогательные функции
    const formatAmount = useCallback((amount) => {
        if (!amount && amount !== 0) return '0';
        return new Intl.NumberFormat('ru-RU').format(amount);
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch {
            return dateString;
        }
    }, []);

    // Генерация опций
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear; i >= currentYear - 5; i--) {
            years.push(i);
        }
        return years;
    }, []);

    const monthOptions = [
        { value: 1, label: 'Январь' }, { value: 2, label: 'Февраль' },
        { value: 3, label: 'Март' }, { value: 4, label: 'Апрель' },
        { value: 5, label: 'Май' }, { value: 6, label: 'Июнь' },
        { value: 7, label: 'Июль' }, { value: 8, label: 'Август' },
        { value: 9, label: 'Сентябрь' }, { value: 10, label: 'Октябрь' },
        { value: 11, label: 'Ноябрь' }, { value: 12, label: 'Декабрь' }
    ];

    if (loading) {
        return (
            <>
                <Header />
                <main className="main">
                    <div className="main__container">
                        <div className="loading">Загрузка...</div>
                    </div>
                </main>
                <MobileHeader />
            </>
        );
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
                            <button
                                className="main__top-section-btn create-event-btn"
                                onClick={() => setIsOpen(true)}
                            >
                                + Новая транзакция
                            </button>
                        </div>
                    </section>

                    {/* Секция с фильтрами для отчета */}
                    

                    <section className="widgets__finance widgets">
                        {/* Общие финансовые виджеты */}
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
                                    {dataFinances.filter(t => t.type === 'expense').length} транзакций
                                </div>
                            </div>
                            <div className="widgets__finance-income budgets shadow-glass">
                                <div className="budget__header">Доходы</div>
                                <div className="budget__sum green">{formatAmount(totalIncome)} ₽</div>
                                <div className="budget__info">
                                    {dataFinances.filter(t => t.type === 'income').length} транзакций
                                </div>
                            </div>
                        </div>
                        <section className="finance-filters shadow-glass">
                        <h2 className="filters-header">Финансовый отчет</h2>

                        <div className="filters-row">
                            <div className="filter-group">
                                <label className="filter-label">Событие:</label>
                                <select
                                    className="filter-select"
                                    value={selectedEvent}
                                    onChange={(e) => setSelectedEvent(e.target.value)}
                                >
                                    <option value="all">Все события</option>
                                    {eventList.map(event => (
                                        <option key={event.id} value={event.id}>
                                            {event.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">Период:</label>
                                <select
                                    className="filter-select"
                                    value={periodType}
                                    onChange={(e) => setPeriodType(e.target.value)}
                                >
                                    <option value="month">Месяц</option>
                                    <option value="year">Год</option>
                                    <option value="custom">Произвольный</option>
                                </select>
                            </div>

                            {periodType === "month" && (
                                <>
                                    <div className="filter-group">
                                        <label className="filter-label">Год:</label>
                                        <select
                                            className="filter-select"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        >
                                            {yearOptions.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <label className="filter-label">Месяц:</label>
                                        <select
                                            className="filter-select"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        >
                                            {monthOptions.map(month => (
                                                <option key={month.value} value={month.value}>
                                                    {month.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {periodType === "year" && (
                                <div className="filter-group">
                                    <label className="filter-label">Год:</label>
                                    <select
                                        className="filter-select"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    >
                                        {yearOptions.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {periodType === "custom" && (
                                <>
                                    <div className="filter-group">
                                        <label className="filter-label">С:</label>
                                        <input
                                            type="date"
                                            className="filter-input date-input"
                                            value={customDateFrom}
                                            onChange={(e) => setCustomDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label className="filter-label">По:</label>
                                        <input
                                            type="date"
                                            className="filter-input date-input"
                                            value={customDateTo}
                                            onChange={(e) => setCustomDateTo(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="local-stats">
                            <small>
                                В локальных данных: {periodTransactionsStats.count} транзакций
                                ({periodTransactionsStats.incomeCount} доходов,
                                {periodTransactionsStats.expenseCount} расходов)
                            </small>
                        </div>
                    </section>

                        <div className="finance-report shadow-glass">
                            <h2 className="report-header">
                                Отчет за {periodType === "month" ?
                                    `${monthOptions.find(m => m.value === selectedMonth)?.label} ${selectedYear}` :
                                    periodType === "year" ?
                                        `${selectedYear} год` :
                                        `${formatDate(customDateFrom)} - ${formatDate(customDateTo)}`}
                                {selectedEvent !== "all" && ` • ${events[selectedEvent] || ""}`}
                            </h2>

                            {loadingReport ? (
                                <div className="report-loading">Загрузка отчета...</div>
                            ) : reportData ? (
                                <div className="report-content">
                                    <div className="report-stats">
                                        <div className="stat-item">
                                            <div className="stat-label">Общий доход</div>
                                            <div className="stat-value green">
                                                {formatAmount(reportData.total_income || 0)} ₽
                                                <div className="stat-subtext">
                                                    {periodTransactionsStats.incomeCount} транзакций
                                                </div>
                                            </div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">Общий расход</div>
                                            <div className="stat-value red">
                                                {formatAmount(reportData.total_expenses || 0)} ₽
                                                <div className="stat-subtext">
                                                    {periodTransactionsStats.expenseCount} транзакций
                                                </div>
                                            </div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">Баланс</div>
                                            <div className={`stat-value ${reportData.balance >= 0 ? 'green' : 'red'}`}>
                                                {formatAmount(reportData.balance || 0)} ₽
                                                <div className="stat-subtext">
                                                    Чистая прибыль
                                                </div>
                                            </div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">Всего транзакций</div>
                                            <div className="stat-value">
                                                {periodTransactionsStats.count}
                                                <div className="stat-subtext">
                                                    За период
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="report-empty">
                                    <p>Нет данных для отчета</p>
                                    {periodTransactionsStats.count > 0 && (
                                        <p className="hint">
                                            Есть {periodTransactionsStats.count} транзакций в локальных данных
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="widgets__finance-transactions shadow-glass">
                            <div className="transactions-header-section">
                                <h2 className="widgets__finance-transactions-header">
                                    Последние транзакции
                                    <span className="transactions-count">
                                        ({recentTransactions.length})
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
                                {recentTransactions.length > 0 ? (
                                    <table className="finance-transactions-table">
                                        <thead>
                                            <tr className="table__header-row">
                                                <th className="table__item-header">Дата</th>
                                                <th className="table__item-header">Событие</th>
                                                <th className="table__item-header">Описание</th>
                                                <th className="table__item-header">Тип</th>
                                                <th className="table__item-header last-summa">Сумма</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTransactions.map(el => {
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
                                                        <td className="table__item table-type-section">
                                                            <span className={`type-badge ${el.type}`}>
                                                                {el.type === 'income' ? 'Доход' : 'Расход'}
                                                            </span>
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
                                            onClick={() => setIsOpen(true)}
                                        >
                                            Создать первую транзакцию
                                        </button>
                                    </div>
                                )}
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
                    </section>
                </div>
            </main>
            <MobileHeader />

            {isOpen && (
                <FinancePopUp
                    setIsOpen={setIsOpen}
                    onFinanceCreated={handleFinanceCreated}
                />
            )}
        </>
    );
}