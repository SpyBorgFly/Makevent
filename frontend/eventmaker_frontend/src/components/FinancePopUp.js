import { useState } from "react";
import eventAPI from "../api";

export function FinancePopUp({ setIsOpen, eventId, onFinanceCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: '',
        category: '',
        date: '',
        description: '',
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

        if (!formData.title.trim()) return alert("Введите название");
        if (!formData.amount) return alert("Введите сумму");
        if (!formData.type) return alert("Выберите тип");
        if (!formData.date) return alert("Выберите дату");

        setLoading(true);

        try {
            const dataToSend = {
                title: formData.title,
                amount: parseFloat(formData.amount),
                type: formData.type,
                category: formData.category,
                date: formData.date,
                description: formData.description,
            };

            // ГЛАВНОЕ изменение — вот этот вызов:
            await eventAPI.createFinanceForEvent(eventId, dataToSend);

            setIsOpen(false);
            onFinanceCreated && onFinanceCreated();

            setFormData({
                title: '',
                amount: '',
                type: '',
                category: '',
                date: '',
                description: '',
            });

        } catch (error) {
            console.error(error);
            alert("Ошибка при добавлении транзакции: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="popup-overlay">
            <div className="popup-form">
                <div className="popup-form__header">
                    <div className="popup-form__header-section">
                        <h1 className="popup-form__header-h">Добавить транзакцию</h1>
                        <div className="popup-form__close-button">
                            <button onClick={() => setIsOpen(false)} className="close-button">
                                &#10006;
                            </button>
                        </div>
                    </div>
                </div>

                <form className="popup-form__form" onSubmit={handleSubmit}>
                    
                    <div className="popup-form__name-section">
                        <div className="popup-headers">Название</div>
                        <input
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="popup-form__name-section-input"
                            required
                        />
                    </div>

                    <div className="popup-form__data-section">
                        <div className="popup-headers">Дата</div>
                        <input
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="popup-form__date-section-input"
                            required
                        />
                    </div>

                    <div className="popup-form__time-section">
                        <div className="popup-headers">Сумма</div>
                        <input
                            name="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className="popup-form__time-section-input"
                            required
                        />
                    </div>

                    <div className="popup-form__type-section">
                        <div className="popup-headers">Тип</div>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="widgets__filter popup-selector"
                            required
                        >
                            <option value="">Не выбрано</option>
                            <option value="expense">Расход</option>
                            <option value="income">Доход</option>
                        </select>
                    </div>

                    <div className="popup-form__type-section">
                        <div className="popup-headers">Категория</div>
                        <input
                            name="category"
                            type="text"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="popup-form__name-section-input"
                        />
                    </div>

                    <div className="popup-form__description-section">
                        <div className="popup-headers">Описание</div>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="popup-form__description-section-input"
                            rows="3"
                        />
                    </div>

                    <div className="popup-form__button-section">
                        <button className="popup-form__button" type="submit" disabled={loading}>
                            {loading ? "Добавление..." : "Добавить"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
