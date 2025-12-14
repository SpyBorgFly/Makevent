import { Link } from "react-router";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import { NotePopUp } from "../components/NotePopUp";
import eventAPI from "../api";
import { useState, useEffect } from "react";

export function NotesPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [dataNotes, setDataNotes] = useState([]);
    const [events, setEvents] = useState({}); // Храним события: {eventId: eventTitle}
    const [loading, setLoading] = useState(true);

    // Загрузка заметок
    const fetchNotes = async () => {
        try {
            const response = await eventAPI.getAllNotes();
            return response || [];
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Загрузка событий для получения названий
    const fetchEvents = async () => {
        try {
            const response = await eventAPI.getAllEvents();
            const eventsMap = {};
            response.forEach(event => {
                eventsMap[event.id] = event.title;
            });
            return eventsMap;
        } catch (error) {
            console.log(error);
            return {};
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Загружаем параллельно заметки и события
                const [notesData, eventsData] = await Promise.all([
                    fetchNotes(),
                    fetchEvents()
                ]);
                
                setDataNotes(notesData);
                setEvents(eventsData);
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Функция для обновления списка заметок (после создания новой)
    const refreshNotes = async () => {
        try {
            const notesData = await fetchNotes();
            setDataNotes(notesData);
        } catch (error) {
            console.error('Ошибка обновления заметок:', error);
        }
    };

    const handleCreateNote = () => {
        setIsOpen(true);
    }

    // Функция для обработки успешного создания заметки
    const handleNoteCreated = () => {
        refreshNotes(); // Обновляем список заметок
    }

    // Функция для разделения тегов
    const splitTags = (tagsString) => {
        if (!tagsString) return [];
        // Разделяем по запятой, удаляем пробелы, фильтруем пустые
        return tagsString.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

    // Получаем название события по ID
    const getEventTitle = (eventId) => {
        return events[eventId] || `Событие #${eventId}`;
    }

    if (loading) {
        return (
            <>
                <Header />
                <main className="main">
                    <div className="main__container">
                        <div className="loading">Загрузка заметок...</div>
                    </div>
                </main>
                <MobileHeader />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="main">
                <div className="main__container">
                    <section className="main__top-section">
                        <div className="main__top-section-header">
                            <h1 className="main__h1 h1-notes">Заметки</h1>
                            <span className="notes-count">
                                {dataNotes.length} заметк{dataNotes.length === 1 ? 'а' : dataNotes.length >= 2 && dataNotes.length <= 4 ? 'и' : 'ок'}
                            </span>
                        </div>
                        <div className="main__top-section-button">
                            <button 
                                className="main__top-section-btn create-event-btn" 
                                onClick={handleCreateNote}
                            >
                                + Новая заметка
                            </button>
                        </div>
                    </section>
                    
                    <section className="notes-widgets">
                        {dataNotes.length > 0 ? (
                            dataNotes.map(note => {
                                const noteTags = splitTags(note.tags);
                                const eventTitle = getEventTitle(note.event);
                                
                                return (
                                    <Link 
                                        to={`/notes/${note.id}`} 
                                        className="notes-widgets__widget shadow-glass" 
                                        key={note.id}
                                    >
                                        <h2 className="notes-widgets__widget-header">
                                            {note.title || 'Без названия'}
                                        </h2>
                                        
                                        <div className="notes-widgets__widget-description">
                                            {note.content ? (
                                                note.content.length > 150 
                                                    ? `${note.content.substring(0, 150)}...` 
                                                    : note.content
                                            ) : (
                                                <span className="no-content">Нет содержимого</span>
                                            )}
                                        </div>
                                        
                                        <div className="notes-widgets__widget-tags">
                                            {/* Теги заметки */}
                                            {noteTags.length > 0 && (
                                                <div className="tags-container">
                                                    {noteTags.map((tag, index) => (
                                                        <span key={index} className="tag card-event-status error">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Событие заметки */}
                                            <div className="event-tag">
                                                <span className="tag card-event-status work" title={eventTitle}>
                                                    {eventTitle}
                                                </span>
                                            </div>
                                            
                                            {/* Дата создания */}
                                            <div className="note-date">
                                                {new Date(note.created_at).toLocaleDateString('ru-RU')}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="empty-notes">
                                <div className="empty-icon">📝</div>
                                <h3>Заметок пока нет</h3>
                                <p>Создайте первую заметку</p>
                                <button 
                                    className="create-first-note-btn"
                                    onClick={handleCreateNote}
                                >
                                    Создать заметку
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <MobileHeader />
            
            {/* Передаём функцию обновления в попап */}
            {isOpen && (
                <NotePopUp 
                    setIsOpen={setIsOpen} 
                    onNoteCreated={handleNoteCreated}
                />
            )}
        </>
    );
}