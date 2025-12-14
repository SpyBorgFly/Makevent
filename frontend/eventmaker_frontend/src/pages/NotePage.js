import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import eventAPI from "../api";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";

export function NotePage() {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const [noteData, setNoteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNote = async () => {
            if (!noteId) return;
            
            try {
                setLoading(true);
                const data = await eventAPI.getMyNote(noteId);
                setNoteData(data);
                setError(null);
            } catch (err) {
                console.error('Ошибка загрузки заметки:', err);
                setError('Не удалось загрузить заметку');
                setNoteData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
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
                                onClick={() => navigate(-1)}
                            >
                                ← Назад
                            </button>
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
                    <div className="note-header">
                        <div className="note-header-info">
                            <button 
                                className="back-button"
                                onClick={() => navigate(-1)}
                                title="Назад"
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
                                    {noteData.event && (
                                        <span className="note-event">
                                            Событие: {noteData.event}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="note-actions">
                            <button
                                className="delete-note-btn"
                                onClick={handleDeleteNote}
                                title="Удалить заметку"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>

                    {/* Теги заметки */}
                    {noteData.tags && (
                        <div className="note-tags">
                            {noteData.tags.split(',').map((tag, index) => (
                                <span key={index} className="note-tag">
                                    #{tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Содержимое заметки */}
                    <section className="note-content">
                        <h2 className="content-title">Содержимое:</h2>
                        <div className="note-content-text">
                            {noteData.content ? (
                                <p>{noteData.content}</p>
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