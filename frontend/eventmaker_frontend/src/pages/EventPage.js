import { useParams, useNavigate } from "react-router";
import eventAPI from "../api";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";

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
                const taskData = await fetchDataTasks(eventId);
                setTaskList(taskData);
            }
            setLoading(false);
        };
        loadData();
    }, [eventId]);

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
            const newTask = {
                event: parseInt(eventId),
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim(),
                status: 'todo',
                priority: 'medium',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                assignees: []
            };

            const response = await eventAPI.createTask(newTask);
            setTaskList(prev => [response, ...prev]);

            setNewTaskTitle("");
            setNewTaskDescription("");

        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
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
            case 'completed': return 'green';
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
                            <h1 className="event__title">{dataEvent.title}</h1>
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
                                {dataEvent.event_type}
                            </span>
                            <span className="event-created">
                                Создано: {new Date(dataEvent.created_at).toLocaleDateString('ru-RU')}
                            </span>
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

                    {/* Описание события */}
                    <section className="event__widget">
                        <div className="event__description-header">Описание:</div>
                        <p className="event__description">{dataEvent.description}</p>
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

                        {/* Список задач */}
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
                            <span
                                className="priority-tag"
                                style={{ backgroundColor: getPriorityColor(task.priority) + '20', color: getPriorityColor(task.priority) }}
                            >
                                {task.priority === 'urgent' ? 'Срочный' :
                                    task.priority === 'high' ? 'Высокий' :
                                        task.priority === 'medium' ? 'Средний' : 'Низкий'}
                            </span>
                            {task.due_date && (
                                <span className="due-date-tag">
                                    📅 {formatDate(task.due_date)}
                                </span>
                            )}
                        </div>
                    </div>

                    {task.description && (
                        <p className="task-description">{task.description}</p>
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