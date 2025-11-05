import React, { useState } from 'react';
import { eventAPI } from '../api';

const EventForm = ({ onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await eventAPI.createEvent(formData);
      console.log('Событие создано:', response.data);
      
      // Сбрасываем форму
      setFormData({
        title: '',
        description: '',
        date: '',
        location: ''
      });
      
      // Уведомляем родительский компонент
      if (onEventCreated) {
        onEventCreated(response.data);
      }
      
    } catch (err) {
      setError('Ошибка при создании события: ' + err.message);
      console.error('Error creating event:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-form">
      <h2>Создать новое событие</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Название события:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Введите название события"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Опишите событие"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Дата и время:</label>
          <input
            type="datetime-local"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Место проведения:</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="Введите место проведения"
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Создание...' : 'Создать событие'}
        </button>
      </form>
    </div>
  );
};

export default EventForm;
