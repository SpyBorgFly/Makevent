import { useState } from "react";
import eventAPI from "../api";

export function PopUpWindow({ setIsOpen }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '52'
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
        setLoading(true);
        try {
            const response = await eventAPI.createEvent(formData);
            console.log("Event successfully created", response);
            setIsOpen(false);
            setFormData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '52'
            });
            alert('Событие успешно создано!');
        }
        catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при создании события');
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
                <form className="popup-form__form" action="" method="post">
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
                            name="date"
                            type="date"
                            className="popup-form__date-section-input"
                            value={formData.date}
                            onChange={handleInputChange}
                            required
                            placeholder="Введите название события" />
                    </div>
                    <div className="popup-form__time-section">
                        <div className="popup-form__time-section-header popup-headers">Время</div>
                        <input
                            name="time"
                            type="time"
                            className="popup-form__time-section-input"
                            value={formData.time}
                            onChange={handleInputChange}
                            required
                            placeholder="Введите название события" />
                    </div>
                    <div className="popup-form__description-section">
                        <div className="popup-form__description-section-header popup-headers">Описание</div>
                        <textarea
                            name="description"
                            type="text"
                            className="popup-form__description-section-input"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            rows="4"
                            placeholder="Коротко опишите мероприятие" />
                    </div>
                    <div className="popup-form__button-section">
                        <button
                            className="popup-form__button"
                            type="submit"
                            disabled={loading}
                            onClick={handleSubmit}>
                                {loading ? "Создание" : "Создать"}
                            </button>
                    </div>
                </form>
            </div>
        </div >
    );
}