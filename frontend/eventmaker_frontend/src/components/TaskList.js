import React, { useState } from 'react';
import './TaskList.css';

export function TaskList() {
  const initialTasks = [
    { id: 1, title: 'Купить продукты', completed: false },
    { id: 2, title: 'Сделать домашнее задание', completed: true },
    { id: 3, title: 'Позвонить маме', completed: false },
    { id: 4, title: 'Заплатить за квартиру', completed: false },
    { id: 5, title: 'Сходить в спортзал', completed: true },
  ];

  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState('');

  // Переключение статуса задачи
  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Добавление новой задачи
  const addTask = (e) => {
    e.preventDefault();
    if (newTask.trim() === '') return;
    
    const newTaskItem = {
      id: Date.now(),
      title: newTask,
      completed: false
    };
    
    setTasks([...tasks, newTaskItem]);
    setNewTask('');
  };

  // Удаление задачи
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Удаление всех выполненных задач
  const deleteCompletedTasks = () => {
    setTasks(tasks.filter(task => !task.completed));
  };

  // Статистика
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="task-list-container">
      <h1 className="task-list-title">Мой список задач</h1>
      
      {/* Форма добавления новой задачи */}
      <form onSubmit={addTask} className="add-task-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Введите новую задачу..."
          className="task-input"
        />
        <button type="submit" className="add-task-btn">
          Добавить
        </button>
      </form>

      {/* Статистика */}
      <div className="task-stats">
        <span>Всего задач: {totalTasks}</span>
        <span>Выполнено: {completedTasks}</span>
        {completedTasks > 0 && (
          <button onClick={deleteCompletedTasks} className="delete-completed-btn">
            Удалить выполненные
          </button>
        )}
      </div>

      {/* Список задач */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-list">Задач нет. Добавьте первую задачу!</div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? 'completed' : ''}`}
            >
              <div className="task-content">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="task-checkbox"
                />
                <span className="task-title">{task.title}</span>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="delete-btn"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
