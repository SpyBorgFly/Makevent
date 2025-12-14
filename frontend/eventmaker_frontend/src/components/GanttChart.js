import { useState } from "react";

export function GanttChart({ tasks, eventDate, formatDate, getTaskStatusText }) {
    const [zoomLevel, setZoomLevel] = useState('weeks');

    if (!tasks.length) return null;

    // Фильтруем задачи с датами
    const tasksWithDates = tasks.filter(task => task.start_date && task.due_date);
    if (!tasksWithDates.length) {
        return (
            <div className="gantt-empty-state">
                <div className="empty-icon">📊</div>
                <h4>Нет данных для диаграммы</h4>
                <p>Добавьте даты начала и окончания к задачам</p>
            </div>
        );
    }

    // 1. Создаем объекты Date для всех дат
    const allStartDates = tasksWithDates.map(task => {
        const date = new Date(task.start_date);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });

    const allEndDates = tasksWithDates.map(task => {
        const date = new Date(task.due_date);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });

    // 2. Находим реальные границы
    const allDates = [...allStartDates, ...allEndDates];
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    allDates.push(normalizedToday);

    if (eventDate) {
        const eventDateObj = new Date(eventDate);
        const normalizedEvent = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate());
        allDates.push(normalizedEvent);
    }

    let normalizedEvent = null;
    const absoluteMinDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const absoluteMaxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // 3. Добавляем отступы
    const paddingDays = zoomLevel === 'weeks' ? 14 : 30;
    const chartStart = new Date(absoluteMinDate);
    chartStart.setDate(absoluteMinDate.getDate() - paddingDays);

    const chartEnd = new Date(absoluteMaxDate);
    chartEnd.setDate(absoluteMaxDate.getDate() + paddingDays);

    // 4. ЕДИНАЯ функция для получения позиции в пикселях
    const getPositionInPixels = (date) => {
        const dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const totalDays = Math.ceil((chartEnd - chartStart) / (1000 * 60 * 60 * 24));
        const elapsedDays = Math.ceil((dateObj - chartStart) / (1000 * 60 * 60 * 24));

        const containerWidth = 1200;
        return (elapsedDays / totalDays) * containerWidth;
    };

    // 5. Генерируем временную шкалу ИСПОЛЬЗУЯ нашу функцию
    const generateTimeScale = () => {
        const scale = [];

        if (zoomLevel === 'weeks') {
            // По неделям
            const startMonday = new Date(chartStart);
            const dayOfWeek = startMonday.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startMonday.setDate(startMonday.getDate() + diffToMonday);

            let currentWeek = new Date(startMonday);

            while (currentWeek <= chartEnd) {
                const weekEnd = new Date(currentWeek);
                weekEnd.setDate(currentWeek.getDate() + 6);

                // Используем нашу функцию для позиционирования
                const weekStartPos = getPositionInPixels(currentWeek);
                const weekEndPos = getPositionInPixels(weekEnd);
                const weekWidth = weekEndPos - weekStartPos;

                const isToday = normalizedToday >= currentWeek && normalizedToday <= weekEnd;
                const isEvent = eventDate && normalizedEvent >= currentWeek && normalizedEvent <= weekEnd;

                scale.push({
                    date: new Date(currentWeek),
                    endDate: new Date(weekEnd),
                    label: `${currentWeek.getDate()} ${getMonthName(currentWeek)}`,
                    fullLabel: `${currentWeek.getDate()} ${getMonthName(currentWeek)} - ${weekEnd.getDate()} ${getMonthName(weekEnd)}`,
                    isToday,
                    isEvent,
                    position: weekStartPos,
                    width: weekWidth
                });

                currentWeek.setDate(currentWeek.getDate() + 7);
            }

        } else if (zoomLevel === 'months') {
            // По месяцам
            const startMonth = new Date(chartStart.getFullYear(), chartStart.getMonth(), 1);
            const endMonth = new Date(chartEnd.getFullYear(), chartEnd.getMonth() + 1, 0);

            let currentMonth = new Date(startMonth);

            while (currentMonth <= endMonth) {
                const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                const monthEnd = new Date(nextMonth.getTime() - 1);

                // Используем нашу функцию для позиционирования
                const monthStartPos = getPositionInPixels(currentMonth);
                const monthEndPos = getPositionInPixels(monthEnd);
                const monthWidth = monthEndPos - monthStartPos;

                const isToday = normalizedToday >= currentMonth && normalizedToday <= monthEnd;
                const isEvent = eventDate && normalizedEvent >= currentMonth && normalizedEvent <= monthEnd;

                scale.push({
                    date: new Date(currentMonth),
                    endDate: new Date(monthEnd),
                    label: getFullMonthName(currentMonth),
                    fullLabel: getFullMonthName(currentMonth) + ' ' + currentMonth.getFullYear(),
                    isToday,
                    isEvent,
                    position: monthStartPos,
                    width: monthWidth
                });

                currentMonth = nextMonth;
            }
        }

        return scale;
    };

    // Вспомогательные функции
    const getMonthName = (date) => {
        const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        return months[date.getMonth()];
    };

    const getFullMonthName = (date) => {
        const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        return months[date.getMonth()];
    };

    const timeScale = generateTimeScale();
    const containerWidth = 1200;

    // 6. Рассчитываем задачи для отображения ИСПОЛЬЗУЯ нашу функцию
    const ganttTasks = tasksWithDates.map((task, index) => {
        const taskStart = new Date(task.start_date);
        const taskEnd = new Date(task.due_date);

        const normalizedStart = new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate());
        const normalizedEnd = new Date(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate());

        // ВОТ ТУТ ИСПОЛЬЗУЕМ ЕДИНУЮ ФУНКЦИЮ!
        const startPos = getPositionInPixels(normalizedStart);
        const endPos = getPositionInPixels(normalizedEnd);

        const width = Math.max(30, endPos - startPos);
        const durationDays = Math.ceil((normalizedEnd - normalizedStart) / (1000 * 60 * 60 * 24)) + 1;

        return {
            ...task,
            normalizedStart,
            normalizedEnd,
            left: Math.max(0, startPos),
            width: Math.min(width, containerWidth - startPos),
            top: index * 45,
            height: 35,
            durationDays
        };
    });

    // 7. Позиции маркеров ИСПОЛЬЗУЯ нашу функцию
    const todayPosition = getPositionInPixels(normalizedToday);

    let eventPosition = null;
    if (eventDate) {
        const eventDateObj = new Date(eventDate);
        const normalizedEvent = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate());
        eventPosition = getPositionInPixels(normalizedEvent);
    }

    // Отладочная информация
    console.log('Chart range:', chartStart.toLocaleDateString(), 'to', chartEnd.toLocaleDateString());
    console.log('Today position:', todayPosition, 'px');
    tasksWithDates.forEach((task, i) => {
        console.log(`Task ${i}:`, task.title,
            'start:', new Date(task.start_date).toLocaleDateString(),
            'left:', ganttTasks[i]?.left, 'px');
    });

    return (
        <div className="gantt-section">
            <div className="gantt-header">
                <h2 className="gantt-title">Диаграмма Ганта</h2>
                <div className="gantt-controls">
                    <div className="zoom-controls">
                        <button
                            className={`zoom-btn ${zoomLevel === 'months' ? 'active' : ''}`}
                            onClick={() => setZoomLevel('months')}
                        >
                            Месяцы
                        </button>
                        <button
                            className={`zoom-btn ${zoomLevel === 'weeks' ? 'active' : ''}`}
                            onClick={() => setZoomLevel('weeks')}
                        >
                            Недели
                        </button>
                    </div>
                    <div className="date-range-info">
                        {chartStart.toLocaleDateString('ru-RU')} — {chartEnd.toLocaleDateString('ru-RU')}
                    </div>
                </div>
            </div>

            <div className="gantt-container-wrapper">
                <div className="gantt-container" style={{ width: `${containerWidth}px` }}>
                    {/* Шкала времени */}
                    <div className="gantt-timeline">
                        {timeScale.map((unit, index) => (
                            <div
                                key={index}
                                className={`gantt-unit ${unit.isToday ? 'today' : ''} ${unit.isEvent ? 'event-day' : ''}`}
                                style={{
                                    width: `${unit.width}px`,
                                    minWidth: '60px'
                                }}
                                title={unit.fullLabel}
                            >
                                <div className="unit-label">
                                    {unit.label}
                                </div>
                                <div className="unit-subtitle">
                                    {zoomLevel === 'weeks' ? 'неделя' : unit.date.getFullYear()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Область задач */}
                    <div className="gantt-tasks-area" style={{
                        height: `${ganttTasks.length * 45 + 20}px`,
                        position: 'relative'
                    }}>
                        {/* Сетка - используем данные из timeScale */}
                        <div className="gantt-grid">
                            {timeScale.map((unit, index) => (
                                <div
                                    key={index}
                                    className="grid-line"
                                    style={{
                                        left: `${unit.position}px`
                                    }}
                                ></div>
                            ))}
                            {/* Последняя линия в конце */}
                            <div
                                className="grid-line"
                                style={{
                                    left: `${containerWidth}px`
                                }}
                            ></div>
                        </div>

                        {/* Задачи */}
                        {ganttTasks.map((task) => (
                            <div
                                key={task.id}
                                className={`gantt-task ${task.status}`}
                                style={{
                                    left: `${task.left}px`,
                                    top: `${task.top}px`,
                                    width: `${task.width}px`,
                                    height: `${task.height}px`
                                }}
                                title={
                                    `Задача: ${task.title}\n` +
                                    `Начало: ${formatDate(task.start_date)}\n` +
                                    `Окончание: ${formatDate(task.due_date)}\n` +
                                    `Статус: ${getTaskStatusText(task.status)}\n` +
                                    `Длительность: ${task.durationDays} дней\n` +
                                    `Позиция: ${task.left.toFixed(0)}px`
                                }
                            >
                                <div className="task-content">
                                    <span className="task-title">{task.title}</span>
                                    {task.width > 100 && (
                                        <span className="task-duration">
                                            {task.durationDays} дн.
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Маркеры */}
                        {todayPosition > 0 && todayPosition < containerWidth && (
                            <div
                                className="gantt-marker current-date-marker"
                                style={{ left: `${todayPosition}px` }}
                            >
                                <div className="marker-label">Сегодня</div>
                            </div>
                        )}

                        {eventPosition && eventPosition > 0 && eventPosition < containerWidth && (
                            <div
                                className="gantt-marker event-date-marker"
                                style={{ left: `${eventPosition}px` }}
                            >
                                <div className="marker-label">Событие</div>
                            </div>
                        )}

                        {/* Отладочная информация */}
                        <div className="debug-info">
                            Задач: {ganttTasks.length}<br />
                            Сегодня: {todayPosition.toFixed(0)}px<br />
                            Диапазон: {Math.round((chartEnd - chartStart) / (1000 * 60 * 60 * 24))} дней
                        </div>
                    </div>
                </div>
            </div>

            {/* Легенда */}
            <div className="gantt-legend">
                <div className="legend-grid">
                    <div className="legend-group">
                        <h4>Статусы задач</h4>
                        <div className="legend-items">
                            <div className="legend-item">
                                <div className="legend-color todo"></div>
                                <span>К выполнению</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-color in_progress"></div>
                                <span>В работе</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-color done"></div>
                                <span>Выполнено</span>
                            </div>
                        </div>
                    </div>

                    <div className="legend-group">
                        <h4>Маркеры</h4>
                        <div className="legend-items">
                            <div className="legend-item">
                                <div className="marker-dot today"></div>
                                <span>Текущая дата</span>
                            </div>
                            {eventDate && (
                                <div className="legend-item">
                                    <div className="marker-dot event"></div>
                                    <span>Дата события</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="legend-group">
                        <h4>Информация</h4>
                        <div className="legend-items">
                            <div className="legend-item">
                                <span>Режим: <strong>
                                    {zoomLevel === 'weeks' ? 'Недели' : 'Месяцы'}
                                </strong></span>
                            </div>
                            <div className="legend-item">
                                <span>Задач: <strong>{ganttTasks.length}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};