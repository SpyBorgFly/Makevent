import { useState } from "react";
import eventAPI from "../api";

export function PopUpWindow({ setIsOpen, onEventCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_day: '',
        event_time: '',
        event_type: '',
    });

    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert("Введите название события");
            return;
        }
        if (!formData.event_day) {
            alert("Выберите дату");
            return;
        }
        if (!formData.event_time) {
            alert("Выберите время");
            return;
        }
        if (!formData.event_type) {
            alert("Выберите тип события");
            return;
        }

        setLoading(true);
        
        try {
            const dataToSend = {
                title: formData.title,
                description: formData.description,
                event_day: formData.event_day,
                event_time: formData.event_time + ":00",
                event_type: formData.event_type
            };
            
            console.log("Отправляемые данные:", dataToSend);
            
            const response = await eventAPI.createEvent(dataToSend);
            
            console.log("Успешно создано:", response);
            setIsOpen(false);

            if (onEventCreated) {
                onEventCreated();
            }

            setFormData({
                title: '',
                description: '',
                event_day: '',
                event_time: '',
                event_type: '',
            });
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при создании события: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="popup-overlay" >
            <div className="popup-form">
                <div className="popup-form__header">
                    <div className="popup-form__header-section">
                        <h1 className="popup-form__header-h">
                            Создать событие
                        </h1>
                        <div className="popup-form__close-button">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="close-button">&#10006;</button>
                        </div>
                    </div>
                </div>
                <form className="popup-form__form" onSubmit={handleSubmit}>
                    <div className="popup-form__name-section">
                        <div className="popup-form__name-section-header popup-headers">Название</div>
                        <input
                            name="title"
                            type="text"
                            className="popup-form__name-section-input"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            placeholder="Введите название события" />
                    </div>
                    <div className="popup-form__data-section">
                        <div className="popup-form__date-section-header popup-headers">Дата</div>
                        <input
                            name="event_day"
                            type="date"
                            className="popup-form__date-section-input"
                            value={formData.event_day}
                            onChange={handleInputChange}
                            required />
                    </div>                    
                    <div className="popup-form__time-section">
                        <div className="popup-form__time-section-header popup-headers">Время</div>
                        <input
                            name="event_time"
                            type="time"
                            className="popup-form__time-section-input"
                            value={formData.event_time}
                            onChange={handleInputChange}
                            required />
                    </div>
                    <div className="popup-form__type-section">
                        <div className="popup-form__type-section-header popup-headers">Тип события</div>
                        <select
                            name="event_type"
                            className="widgets__filter popup-selector"
                            value={formData.event_type}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Не выбрано</option>
                            <option value="conference">Конференция</option>
                            <option value="teambuilding">Тимбилдинг</option>
                            <option value="webinar">Вебинар</option>
                        </select>
                    </div>
                    <div className="popup-form__description-section">
                        <div className="popup-form__description-section-header popup-headers">Описание</div>
                        <textarea
                            name="description"
                            className="popup-form__description-section-input"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="4"
                            placeholder="Коротко опишите мероприятие" />
                    </div>
                    <div className="popup-form__button-section">
                        <button
                            className="popup-form__button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Создание..." : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
}