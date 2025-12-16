import { useParams, useNavigate } from "react-router";
import eventAPI from "../api";
import { useEffect, useState, useRef } from "react";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import { GanttChart } from "../components/GanttChart";

export function EventPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [dataEvent, setDataEvent] = useState(null);
    const [taskList, setTaskList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [newTaskDueDate, setNewTaskDueDate] = useState("");
    const [newTaskStartDate, setNewTaskStartDate] = useState("");
    
    // Состояния для редактирования
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedDescription, setEditedDescription] = useState("");
    
    // Рефы для автофокуса
    const titleInputRef = useRef(null);
    const descriptionTextareaRef = useRef(null);

    const fetchData = async (id) => {
        try {
            const response = await eventAPI.getEvent(id);
            return response;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    const fetchDataTasks = async (id) => {
        try {
            const response = await eventAPI.getMyTasksByEvent(id);
            return response || [];
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            if (eventId) {
                const data = await fetchData(eventId);
                setDataEvent(data);
                // Устанавливаем начальные значения для редактирования
                setEditedTitle(data?.title || "");
                setEditedDescription(data?.description || "");
                const taskData = await fetchDataTasks(eventId);
                setTaskList(taskData);
            }
            setLoading(false);
        };
        loadData();
    }, [eventId]);

    // Автофокус при входе в режим редактирования
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
        if (isEditingDescription && descriptionTextareaRef.current) {
            descriptionTextareaRef.current.focus();
        }
    }, [isEditingTitle, isEditingDescription]);

    // Функция сохранения изменений события
    const saveEventChanges = async () => {
        if (!eventId || !dataEvent) return;
        
        try {
            await eventAPI.updateEvent(eventId, {
                ...dataEvent,
                title: editedTitle,
                description: editedDescription
            });
            
            // Обновляем локальные данные
            setDataEvent(prev => ({
                ...prev,
                title: editedTitle,
                description: editedDescription,
                updated_at: new Date().toISOString()
            }));
            
        } catch (error) {
            console.error('Ошибка сохранения события:', error);
        }
    };

    // Обработчик потери фокуса (сохраняем автоматически)
    const handleBlur = async (field) => {
        await saveEventChanges();
        
        switch(field) {
            case 'title':
                setIsEditingTitle(false);
                break;
            case 'description':
                setIsEditingDescription(false);
                break;
        }
    };

    // Обработчик нажатия клавиш
    const handleKeyPress = (e, field) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBlur(field);
        }
        if (e.key === 'Escape') {
            // Восстанавливаем оригинальные значения
            switch(field) {
                case 'title':
                    setEditedTitle(dataEvent.title || "");
                    setIsEditingTitle(false);
                    break;
                case 'description':
                    setEditedDescription(dataEvent.description || "");
                    setIsEditingDescription(false);
                    break;
            }
        }
    };

    const toggleTaskStatus = async (taskId, currentStatus) => {
        try {
            let newStatus;
            if (currentStatus === 'todo') {
                newStatus = 'in_progress';
            } else if (currentStatus === 'in_progress') {
                newStatus = 'done';
            } else if (currentStatus === 'done') {
                newStatus = 'todo';
            } else {
                newStatus = 'todo';
            }

            const currentTask = await eventAPI.getMyTask(taskId);

            const updatedTask = {
                ...currentTask,
                status: newStatus,
                event: typeof currentTask.event === 'object'
                    ? currentTask.event.id
                    : currentTask.event
            };

            await eventAPI.changeTask(taskId, updatedTask);

            setTaskList(prev => prev.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
            ));
        } catch (error) {
            console.error('Ошибка при обновлении задачи:', error);
            alert('Не удалось обновить статус задачи');
        }
    };

    const addNewTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) {
            alert('Введите название задачи');
            return;
        }

        try {
            let dueDateISO = null;
            if (newTaskDueDate) {
                const date = new Date(newTaskDueDate);
                date.setHours(12, 0, 0, 0);
                dueDateISO = date.toISOString();
            }

            let startDateISO = null;
            if (newTaskStartDate) {
                const date = new Date(newTaskStartDate);
                date.setHours(9, 0, 0, 0); // Начало дня в 9:00
                startDateISO = date.toISOString();
            }

            const newTask = {
                event: parseInt(eventId),
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim(),
                status: 'todo',
                priority: 'medium',
                start_date: startDateISO, // Добавляем дату начала
                due_date: dueDateISO || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                assignees: []
            };

            console.log('Отправляемая задача:', newTask);

            const response = await eventAPI.createTask(newTask);
            setTaskList(prev => [response, ...prev]);

            // Сбрасываем поля формы
            setNewTaskTitle("");
            setNewTaskDescription("");
            setNewTaskStartDate("");
            setNewTaskDueDate("");

        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
            console.error('Детали ошибки:', error.response?.data);
            alert('Не удалось создать задачу');
        }
    };
    const deleteTask = async (taskId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
            try {
                await eventAPI.deleteTask(taskId);
                setTaskList(prev => prev.filter(task => task.id !== taskId));
            } catch (error) {
                console.error('Ошибка при удалении задачи:', error);
                alert('Не удалось удалить задачу');
            }
        }
    };

    const deleteEvent = async () => {
        try {
            await eventAPI.deleteEvent(eventId);
            navigate('/events');
        } catch (error) {
            console.error('Ошибка при удалении события:', error);
            alert('Не удалось удалить событие');
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const updateEventStatus = async (newStatus) => {
        try {
            console.log(`Изменение статуса события ${eventId} на ${newStatus}`);

            const currentEvent = await eventAPI.getEvent(eventId);
            console.log('Текущее событие с сервера:', currentEvent);
            const updatedEvent = {
                ...currentEvent,
                status: newStatus,
                created_by: typeof currentEvent.created_by === 'object'
                    ? currentEvent.created_by.id
                    : currentEvent.created_by
            };

            delete updatedEvent.created_at;
            delete updatedEvent.updated_at;

            console.log('Отправляемые данные для обновления:', updatedEvent);

            const response = await eventAPI.updateEvent(eventId, updatedEvent);
            console.log('Событие успешно обновлено:', response);

            setDataEvent(prev => ({ ...prev, status: newStatus }));
            setShowStatusMenu(false);


        } catch (error) {
            console.error('Ошибка при изменении статуса события:', error);
            console.error('Детали ошибки:', error.response?.data);

            if (error.message.includes('400') || error.message.includes('PUT')) {
                console.log('Пробуем PATCH...');
                try {
                    const patchResponse = await fetch(`http://127.0.0.1:8000/api/events/${eventId}/`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: newStatus })
                    });

                    if (patchResponse.ok) {
                        const data = await patchResponse.json();
                        console.log('PATCH успешен:', data);
                        setDataEvent(prev => ({ ...prev, status: newStatus }));
                        setShowStatusMenu(false);
                    } else {
                        throw new Error('PATCH тоже не сработал');
                    }
                } catch (patchError) {
                    console.error('PATCH failed:', patchError);
                    alert('Не удалось изменить статус события. Проверьте консоль для деталей.');
                }
            } else {
                alert('Не удалось изменить статус события: ' + error.message);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Без срока';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return '#DC2626';
            case 'high': return '#EF4444';
            case 'medium': return '#F59E0B';
            case 'low': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getTaskStatusText = (status) => {
        switch (status) {
            case 'todo': return 'К выполнению';
            case 'in_progress': return 'В работе';
            case 'done': return 'Выполнено';
            case 'cancelled': return 'Отменено';
            default: return status;
        }
    };

    const getEventStatusText = (status) => {
        switch (status) {
            case 'planned': return 'Планируется';
            case 'in_progress': return 'В работе';
            case 'done': return 'Завершено';
            case 'cancelled': return 'Отменено';
            default: return status;
        }
    };

    const getEventStatusColor = (status) => {
        switch (status) {
            case 'planned': return 'orange';
            case 'in_progress': return 'blue';
            case 'done': return 'green';
            case 'cancelled': return 'gray';
            default: return 'blue';
        }
    };

    const todoTasks = taskList.filter(task => task.status === 'todo');
    const inProgressTasks = taskList.filter(task => task.status === 'in_progress');
    const doneTasks = taskList.filter(task => task.status === 'done');
    const cancelledTasks = taskList.filter(task => task.status === 'cancelled');

    if (loading) {
        return (
            <div className="loading-container">
                <Header />
                <div className="loading">Загрузка...</div>
                <MobileHeader />
            </div>
        );
    }

    if (!dataEvent) {
        return (
            <div className="error-container">
                <Header />
                <div className="error-message">Событие не найдено</div>
                <MobileHeader />
            </div>
        );
    }

    const availableStatuses = [
        { value: 'planned', label: 'Планируется', color: 'orange' },
        { value: 'in_progress', label: 'В работе', color: 'blue' },
        { value: 'done', label: 'Завершено', color: 'green' },
        { value: 'cancelled', label: 'Отменено', color: 'gray' }
    ];

    return (
        <>
            <Header />
            <main className="main">
                <div className="main__container">
                    <div className="header-event__section">
                        <div className="event-header-top">
                            {/* Название события с редактированием */}
                            {isEditingTitle ? (
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                                    <input
                                        ref={titleInputRef}
                                        type="text"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        onKeyDown={(e) => handleKeyPress(e, 'title')}
                                        onBlur={() => handleBlur('title')}
                                        className="event-title-input"
                                        style={{
                                            flex: 1,
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                        placeholder="Название события"
                                    />
                                    <small style={{color: '#666', fontSize: '12px'}}>
                                        Enter - сохранить, Esc - отмена
                                    </small>
                                </div>
                            ) : (
                                <h1 
                                    className="event__title"
                                    onDoubleClick={() => setIsEditingTitle(true)}
                                    style={{cursor: 'pointer'}}
                                    title="Двойной клик для редактирования названия"
                                >
                                    {dataEvent.title}
                                </h1>
                            )}
                            <div className="event-actions">
                                <div className="status-selector-wrapper">
                                    <button
                                        className={`status-btn status-${getEventStatusColor(dataEvent.status)}`}
                                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                                    >
                                        {getEventStatusText(dataEvent.status)}
                                        <span className="status-arrow">▼</span>
                                    </button>

                                    {showStatusMenu && (
                                        <div className="status-menu">
                                            {availableStatuses.map(status => (
                                                <button
                                                    key={status.value}
                                                    className={`status-menu-item ${status.value === dataEvent.status ? 'active' : ''}`}
                                                    onClick={() => updateEventStatus(status.value)}
                                                >
                                                    <span className={`status-dot status-${status.color}`}></span>
                                                    {status.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="delete-event-btn"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    title="Удалить событие"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className="event-meta">
                            <span className="event-date">
                                {new Date(dataEvent.event_day).toLocaleDateString('ru-RU')}
                                {dataEvent.event_time && `, ${dataEvent.event_time.slice(0, 5)}`}
                            </span>
                            <span className="event-type">
                                {dataEvent.event_type === 'webinar' ?
                                    'Вебинар' : dataEvent.event_type === 'teambuilding' ?
                                        'Тимбилдинг' : dataEvent.event_type === 'conference' ? 'Конференция' : ''}
                            </span>
                            <span className="event-created">
                                Создано: {new Date(dataEvent.created_at).toLocaleDateString('ru-RU')}
                            </span>
                            {dataEvent.updated_at !== dataEvent.created_at && (
                                <span className="event-updated">
                                    Изменено: {new Date(dataEvent.updated_at).toLocaleDateString('ru-RU')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Подтверждение удаления */}
                    {showDeleteConfirm && (
                        <div className="delete-confirm-overlay">
                            <div className="delete-confirm-modal">
                                <h3>Удалить событие?</h3>
                                <p>Вы уверены, что хотите удалить событие "{dataEvent.title}"?</p>
                                <p className="warning-text">Это действие нельзя отменить. Все задачи и данные события будут удалены.</p>
                                <div className="delete-confirm-actions">
                                    <button
                                        className="cancel-btn"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        className="confirm-delete-btn"
                                        onClick={deleteEvent}
                                    >
                                        Да, удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Описание события с редактированием */}
                    <section className="event__widget">
                        <div className="event__description-header">Описание:</div>
                        {isEditingDescription ? (
                            <div style={{position: 'relative'}}>
                                <textarea
                                    ref={descriptionTextareaRef}
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    onKeyDown={(e) => handleKeyPress(e, 'description')}
                                    onBlur={() => handleBlur('description')}
                                    className="event-description-input"
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="Описание события"
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '10px',
                                    background: 'rgba(255,255,255,0.9)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: '#666'
                                }}>
                                    Ctrl+Enter - сохранить, Esc - отмена
                                </div>
                            </div>
                        ) : (
                            <p 
                                className="event__description"
                                onDoubleClick={() => setIsEditingDescription(true)}
                                style={{
                                    cursor: 'pointer',
                                    minHeight: '50px',
                                    padding: '10px 0'
                                }}
                                title="Двойной клик для редактирования описания"
                            >
                                {dataEvent.description || (
                                    <span style={{color: '#666', fontStyle: 'italic'}}>
                                        (двойной клик чтобы добавить описание)
                                    </span>
                                )}
                            </p>
                        )}
                    </section>

                    {/* Секция задач */}
                    <section className="task__widget">
                        <div className="task__header-section">
                            <h2 className="task__header">
                                Задачи
                                <span className="task-count">({taskList.length})</span>
                            </h2>
                        </div>

                        {/* Форма добавления задачи */}
                        <form className="add-task-form" onSubmit={addNewTask}>
                            <div className="form-row">
                                <input
                                    type="text"
                                    className="task-input"
                                    placeholder="Название задачи"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    required
                                />
                                <input
                                    type="date"
                                    className="date-input"
                                    placeholder="Начало"
                                    value={newTaskStartDate}
                                    onChange={(e) => setNewTaskStartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    title="Дата начала задачи"
                                />
                                <input
                                    type="date"
                                    className="date-input"
                                    placeholder="Дедлайн"
                                    value={newTaskDueDate}
                                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                                    min={newTaskStartDate || new Date().toISOString().split('T')[0]}
                                    title="Дата окончания задачи"
                                />
                                <button type="submit" className="add-task-btn">
                                    Добавить
                                </button>
                            </div>
                            <textarea
                                className="task-textarea"
                                placeholder="Описание задачи (необязательно)"
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                rows="2"
                            />
                        </form>

                        <div className="task__list">
                            {/* Задачи к выполнению */}
                            {todoTasks.length > 0 && (
                                <div className="task-group">
                                    <h3 className="task-group__title todo">
                                        К выполнению ({todoTasks.length})
                                    </h3>
                                    {todoTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={toggleTaskStatus}
                                            onDelete={deleteTask}
                                            formatDate={formatDate}
                                            getPriorityColor={getPriorityColor}
                                            getStatusText={getTaskStatusText}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Задачи в работе */}
                            {inProgressTasks.length > 0 && (
                                <div className="task-group">
                                    <h3 className="task-group__title in-progress">
                                        В работе ({inProgressTasks.length})
                                    </h3>
                                    {inProgressTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={toggleTaskStatus}
                                            onDelete={deleteTask}
                                            formatDate={formatDate}
                                            getPriorityColor={getPriorityColor}
                                            getStatusText={getTaskStatusText}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Выполненные задачи */}
                            {doneTasks.length > 0 && (
                                <div className="task-group done-tasks">
                                    <h3 className="task-group__title done">
                                        Выполнено ({doneTasks.length})
                                    </h3>
                                    {doneTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={toggleTaskStatus}
                                            onDelete={deleteTask}
                                            formatDate={formatDate}
                                            getPriorityColor={getPriorityColor}
                                            getStatusText={getTaskStatusText}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Отмененные задачи */}
                            {cancelledTasks.length > 0 && (
                                <div className="task-group cancelled-tasks">
                                    <h3 className="task-group__title cancelled">
                                        Отменено ({cancelledTasks.length})
                                    </h3>
                                    {cancelledTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={toggleTaskStatus}
                                            onDelete={deleteTask}
                                            formatDate={formatDate}
                                            getPriorityColor={getPriorityColor}
                                            getStatusText={getTaskStatusText}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Если задач нет */}
                            {taskList.length === 0 && (
                                <div className="tasks__none">
                                    <div className="empty-state">
                                        <div className="empty-icon">📋</div>
                                        <p className="empty-text">Задач пока нет</p>
                                        <p className="empty-subtext">Добавьте первую задачу для этого события</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                    <section className="gantt-section">
                        <div className="task__header-section">
                            <h2 className="task__header">
                                Диаграмма Ганта
                                <span className="task-count">({taskList.filter(t => t.start_date && t.due_date).length})</span>
                            </h2>
                        </div>

                        <GanttChart
                            tasks={taskList}
                            eventDate={dataEvent.event_day}
                            formatDate={formatDate}
                            getTaskStatusText={getTaskStatusText}
                        />
                    </section>
                </div>
            </main>
            <MobileHeader />
        </>
    );
}

function TaskItem({ task, onToggle, onDelete, formatDate, getPriorityColor, getStatusText }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCheckboxChange = () => {
        onToggle(task.id, task.status);
    };

    const handleDelete = () => {
        onDelete(task.id);
    };

    const getActionButtonText = (status) => {
        switch (status) {
            case 'todo': return 'Начать выполнение';
            case 'in_progress': return 'Завершить';
            case 'done': return 'Вернуть в работу';
            case 'cancelled': return 'Восстановить';
            default: return 'Изменить статус';
        }
    };

    // Рассчитываем прогресс задачи (если есть даты)
    const getTaskProgress = () => {
        if (!task.start_date || !task.due_date) return null;

        const start = new Date(task.start_date);
        const due = new Date(task.due_date);
        const now = new Date();

        const totalDuration = due - start;
        const elapsed = now - start;

        if (totalDuration <= 0) return 100;
        if (elapsed <= 0) return 0;
        if (elapsed >= totalDuration) return 100;

        return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    };

    const progress = getTaskProgress();

    return (
        <div className={`task-item ${task.status === 'done' ? 'completed' : ''} ${task.status === 'cancelled' ? 'cancelled' : ''}`}>
            <div className="task-item__content" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="task-checkbox-container">
                    <label className="task-checkbox">
                        <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={handleCheckboxChange}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <span className="checkmark"></span>
                    </label>
                </div>

                <div className="task-info">
                    <div className="task-header">
                        <span className="task-title">{task.title}</span>
                        <div className="task-tags">
                            {task.start_date && task.due_date && (
                                <span className="date-range-tag" title={`${formatDate(task.start_date)} - ${formatDate(task.due_date)}`}>
                                    📅 {formatDate(task.start_date)} → {formatDate(task.due_date)}
                                </span>
                            )}
                            {task.start_date && !task.due_date && (
                                <span className="start-date-tag">
                                    ▶️ {formatDate(task.start_date)}
                                </span>
                            )}
                            {!task.start_date && task.due_date && (
                                <span className="due-date-tag">
                                    ⏰ {formatDate(task.due_date)}
                                </span>
                            )}
                        </div>
                    </div>

                    {task.description && (
                        <p className="task-description">{task.description}</p>
                    )}

                    {/* Прогресс бар для задачи (если есть обе даты) */}
                    {progress !== null && (
                        <div className="task-progress-bar">
                            <div
                                className="task-progress-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                            <div className="task-progress-text">
                                {Math.round(progress)}%
                            </div>
                        </div>
                    )}

                    <div className="task-footer">
                        <span className={`status-badge ${task.status}`}>
                            {getStatusText(task.status)}
                        </span>
                        {task.assignees && task.assignees.length > 0 && (
                            <span className="assignees-count">
                                👥 {task.assignees.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="task-actions">
                <button
                    className="task-action-btn"
                    onClick={handleCheckboxChange}
                >
                    {getActionButtonText(task.status)}
                </button>
                <button
                    className="delete-task-btn"
                    onClick={handleDelete}
                    title="Удалить задачу"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}