import React, { useState, useEffect } from 'react';
import { eventAPI } from '../api';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAllEvents();
      // Безопасная проверка на массив
      const eventsData = Array.isArray(response) ? response : [];
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке событий: ' + err.message);
      console.error('Error fetching events:', err);
      // Устанавливаем пустой массив при ошибке
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это событие?')) {
      try {
        await eventAPI.deleteEvent(id);
        setEvents(events.filter(event => event.id !== id));
      } catch (err) {
        setError('Ошибка при удалении события: ' + err.message);
      }
    }
  };

  if (loading) {
    return <div className="loading">Загрузка событий...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="event-list">
      <h2>Список событий</h2>
      {!events || events.length === 0 ? (
        <div className="no-events">
          <p>📅 Нет событий</p>
          <p>Создайте первое событие с помощью формы выше!</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <div key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <p><strong>Описание:</strong> {event.description}</p>
              <p><strong>Дата:</strong> {new Date(event.date).toLocaleString('ru-RU')}</p>
              <p><strong>Место:</strong> {event.location}</p>
              <p><strong>Создано:</strong> {new Date(event.created_at).toLocaleString('ru-RU')}</p>
              <div className="event-actions">
                <button 
                  onClick={() => handleDeleteEvent(event.id)}
                  className="delete-btn"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
