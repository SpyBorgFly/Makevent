// components/NotePopUp.js
import { useState, useEffect } from "react";
import eventAPI from "../api";

export function NotePopUp({ setIsOpen, eventId, onNoteCreated }) {
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        tags: "",
        event: eventId || "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!eventId) {
            const loadEvents = async () => {
                try {
                    const data = await eventAPI.getAllEvents();
                    setEvents(data);
                } catch (error) {
                    console.error(error);
                    alert("Не удалось загрузить список событий");
                } finally {
                    setLoadingEvents(false);
                }
            };
            loadEvents();
        } else {
            setLoadingEvents(false);
        }
    }, [eventId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) return alert("Введите заголовок заметки");
        if (!formData.event) return alert("Выберите событие");

        setLoading(true);

        try {
            const payload = {
                title: formData.title,
                content: formData.content,
                tags: formData.tags,
            };

            await eventAPI.createNote(formData.event, payload);

            setIsOpen(false);
            onNoteCreated && onNoteCreated();

            setFormData({
                title: "",
                content: "",
                tags: "",
                event: eventId || "",
            });
        } catch (error) {
            console.error(error);
            alert("Ошибка при создании заметки");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="popup-overlay">
            <div className="popup-form">
                <div className="popup-form__header-section">
                    <h1 className="popup-form__header-h">Создать заметку</h1>
                    <div className="popup-form__close-button">
                        <button onClick={() => setIsOpen(false)} className="close-button">
                            &#10006;
                        </button>
                    </div>
                </div>

                <form className="popup-form__form" onSubmit={handleSubmit}>

                    {!eventId && (
                        <div className="popup-form__type-section">
                            <div className="popup-headers">Событие</div>
                            {loadingEvents ? (
                                <div>Загрузка событий...</div>
                            ) : (
                                <select
                                    name="event"
                                    value={formData.event}
                                    onChange={handleInputChange}
                                    className="widgets__filter popup-selector"
                                    required
                                >
                                    <option value="">Выберите событие</option>
                                    {events.map(ev => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.title}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    <div className="popup-form__name-section">
                        <div className="popup-headers">Название</div>
                        <input
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="popup-form__name-section-input"
                            placeholder="Введите название заметки"
                            required
                        />
                    </div>

                    <div className="popup-form__description-section">
                        <div className="popup-headers">Содержание</div>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            className="popup-form__description-section-input"
                            rows="4"
                            placeholder="Текст заметки"
                        />
                    </div>

                    <div className="popup-form__type-section">
                        <div className="popup-headers">Теги</div>
                        <input
                            name="tags"
                            type="text"
                            value={formData.tags}
                            onChange={handleInputChange}
                            className="popup-form__name-section-input"
                            placeholder="Пример: важное, идеи"
                        />
                    </div>

                    <div className="popup-form__button-section">
                        <button className="popup-form__button" type="submit" disabled={loading}>
                            {loading ? "Создание..." : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
