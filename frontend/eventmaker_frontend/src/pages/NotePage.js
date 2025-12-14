import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import eventAPI from "../api";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";
import { Link } from "react-router";

export function NotePage() {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const [noteData, setNoteData] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!noteId) return;

            try {
                setLoading(true);

                const note = await eventAPI.getMyNote(noteId);
                setNoteData(note);

                if (note.event) {
                    try {
                        const event = await eventAPI.getEvent(note.event);
                        setEventData(event);
                    } catch (eventError) {
                        console.warn('Не удалось загрузить событие:', eventError);
                    }
                }

                setError(null);
            } catch (err) {
                console.error('Ошибка загрузки заметки:', err);
                setError('Не удалось загрузить заметку');
                setNoteData(null);
                setEventData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [noteId]);

    const handleDeleteNote = async () => {
        if (window.confirm('Вы уверены, что хотите удалить эту заметку?')) {
            try {
                await eventAPI.deleteMyNote(noteId);
                navigate('/notes');
            } catch (err) {
                console.error('Ошибка удаления заметки:', err);
                alert('Не удалось удалить заметку');
            }
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const splitTags = (tagsString) => {
        if (!tagsString) return [];
        return tagsString.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="main">
                    <div className="main__container">
                        <div className="loading">Загрузка заметки...</div>
                    </div>
                </main>
                <MobileHeader />
            </>
        );
    }

    if (error || !noteData) {
        return (
            <>
                <Header />
                <main className="main">
                    <div className="main__container">
                        <div className="error-container">
                            <div className="error-icon">📝</div>
                            <h2 className="error-title">Заметка не найдена</h2>
                            <p className="error-text">{error || 'Заметка не существует или была удалена'}</p>
                            <button
                                className="back-btn"
                                onClick={() => navigate('/notes')}
                            >
                                ← К списку заметок
                            </button>
                        </div>
                    </div>
                </main>
                <MobileHeader />
            </>
        );
    }

    const tags = splitTags(noteData.tags);

    return (
        <>
            <Header />
            <main className="main">
                <div className="main__container">
                    <div className="note-header">
                        <div className="note-header-info">
                            <button
                                className="back-button"
                                onClick={() => navigate('/notes')}
                                title="К списку заметок"
                            >
                                ←
                            </button>
                            <div>
                                <h1 className="note-title">{noteData.title || 'Без названия'}</h1>
                                <div className="note-meta">
                                    <span className="note-date">
                                        Создано: {formatDateTime(noteData.created_at)}
                                    </span>
                                    {noteData.updated_at !== noteData.created_at && (
                                        <span className="note-date">
                                            Изменено: {formatDateTime(noteData.updated_at)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="note-actions">
                            {noteData.event && (
                                <Link
                                    to={`/events/${noteData.event}`}
                                    className="event-link-btn"
                                >
                                    К событию
                                </Link>
                            )}
                            <button
                                className="delete-note-btn"
                                onClick={handleDeleteNote}
                                title="Удалить заметку"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>

                    {tags.length > 0 && (
                        <div className="note-tags-section">
                            <h3 className="tags-title">
                                <span className="tags-icon"></span> Теги:
                            </h3>
                            <div className="note-tags">
                                {tags.map((tag, index) => (
                                    <span key={index} className="note-tag">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Содержимое заметки */}
                    <section className="note-content">
                        <h2 className="content-title">Содержимое:</h2>
                        <div className="note-content-text">
                            {noteData.content ? (
                                <div className="content-paragraphs">
                                    {noteData.content.split('\n').map((paragraph, index) => (
                                        <p key={index} className="content-paragraph">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-content">У этой заметки нет содержимого</p>
                            )}
                        </div>
                    </section>
                </div>
            </main>
            <MobileHeader />
        </>
    );
}