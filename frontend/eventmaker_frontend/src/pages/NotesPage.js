import { Link } from "react-router";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import { NotePopUp } from "../components/NotePopUp";
import eventAPI from "../api";
import { useState, useEffect } from "react";

export function NotesPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [dataNotes, setDataNotes] = useState([]);
    const [events, setEvents] = useState({});
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);

    const fetchNotes = async () => {
        try {
            const response = await eventAPI.getAllNotes();
            // ЗАЩИТА: Всегда возвращаем массив
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.log('Ошибка загрузки заметок:', error);
            
            // Если ошибка 401 - нет авторизации
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                setAuthError(true);
            }
            
            return [];
        }
    }

    const fetchEvents = async () => {
        try {
            const response = await eventAPI.getAllEvents();
            const eventsMap = {};
            
            // ЗАЩИТА: response должен быть массивом
            const eventsArray = Array.isArray(response) ? response : [];
            
            eventsArray.forEach(event => {
                eventsMap[event.id] = event.title;
            });
            return eventsMap;
        } catch (error) {
            console.log('Ошибка загрузки событий:', error);
            return {};
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // ПРОВЕРКА: Есть ли токен?
                const token = localStorage.getItem('auth_token');
                console.log('NotesPage: Токен в localStorage:', token ? 'Есть' : 'Нет');
                
                if (!token) {
                    setAuthError(true);
                    setLoading(false);
                    return;
                }
                
                const [notesData, eventsData] = await Promise.all([
                    fetchNotes(),
                    fetchEvents()
                ]);

                setDataNotes(notesData);
                setEvents(eventsData);
                setAuthError(false);
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const refreshNotes = async () => {
        try {
            const notesData = await fetchNotes();
            setDataNotes(notesData);
        } catch (error) {
            console.error('Ошибка обновления заметок:', error);
        }
    };

    const handleCreateNote = () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setAuthError(true);
            alert('Сначала выполните авторизацию через Telegram!');
            return;
        }
        setIsOpen(true);
    }

    const handleNoteCreated = () => {
        refreshNotes();
    }

    const handleAuthRedirect = () => {
        // Перенаправляем на главную для авторизации
        window.location.href = '/';
    }

    const splitTags = (tagsString) => {
        if (!tagsString) return [];
        return tagsString.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

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

    if (authError) {
        return (
            <>
                <Header />
                <main className="main">
                    <div className="main__container">
                        <div className="auth-error-container">
                            <div className="auth-error-icon">🔐</div>
                            <h2>Требуется авторизация</h2>
                            <p>Для просмотра заметок необходимо войти через Telegram</p>
                            <button 
                                className="auth-button"
                                onClick={handleAuthRedirect}
                            >
                                Перейти к авторизации
                            </button>
                            <p className="auth-hint">
                                Если авторизация не работает, попробуйте:
                                <br/>1. Нажать "Войти через Telegram" на главной странице
                                <br/>2. Обновить Mini App (потянуть вниз)
                            </p>
                        </div>
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