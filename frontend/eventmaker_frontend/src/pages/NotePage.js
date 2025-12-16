import { useParams, useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
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
    
    // Состояния для редактирования
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedContent, setEditedContent] = useState("");
    const [editedTags, setEditedTags] = useState("");
    
    // Рефы для автофокуса и отслеживания изменений
    const titleInputRef = useRef(null);
    const contentTextareaRef = useRef(null);
    const tagsInputRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!noteId) return;

            try {
                setLoading(true);

                const note = await eventAPI.getMyNote(noteId);
                setNoteData(note);
                // Устанавливаем начальные значения для редактирования
                setEditedTitle(note.title || "");
                setEditedContent(note.content || "");
                setEditedTags(note.tags || "");

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

    // Автофокус при входе в режим редактирования
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
        if (isEditingContent && contentTextareaRef.current) {
            contentTextareaRef.current.focus();
        }
        if (isEditingTags && tagsInputRef.current) {
            tagsInputRef.current.focus();
        }
    }, [isEditingTitle, isEditingContent, isEditingTags]);

    // Функция сохранения изменений с дебаунсом
    const saveChanges = async () => {
        if (!noteId) return;
        
        try {
            await eventAPI.updateNote(noteId, {
                title: editedTitle,
                content: editedContent,
                tags: editedTags
            });
            
            // Обновляем локальные данные
            setNoteData(prev => ({
                ...prev,
                title: editedTitle,
                content: editedContent,
                tags: editedTags,
                updated_at: new Date().toISOString()
            }));
            
        } catch (error) {
            console.error('Ошибка сохранения заметки:', error);
            // Можно добавить тонкое уведомление вместо alert
            // Например, временное изменение цвета границы
        }
    };

    // Обработчик потери фокуса (сохраняем автоматически)
    const handleBlur = async (field) => {
        // Отменяем предыдущий таймаут
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        // Сохраняем немедленно
        await saveChanges();
        
        // Выходим из режима редактирования
        switch(field) {
            case 'title':
                setIsEditingTitle(false);
                break;
            case 'content':
                setIsEditingContent(false);
                break;
            case 'tags':
                setIsEditingTags(false);
                break;
        }
    };

    // Обработчик нажатия Enter для быстрого сохранения
    const handleKeyPress = (e, field) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBlur(field);
        }
        if (e.key === 'Escape') {
            // Восстанавливаем оригинальные значения
            switch(field) {
                case 'title':
                    setEditedTitle(noteData.title || "");
                    setIsEditingTitle(false);
                    break;
                case 'content':
                    setEditedContent(noteData.content || "");
                    setIsEditingContent(false);
                    break;
                case 'tags':
                    setEditedTags(noteData.tags || "");
                    setIsEditingTags(false);
                    break;
            }
        }
    };

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
                            <div style={{flex: 1}}>
                                {isEditingTitle ? (
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <input
                                            ref={titleInputRef}
                                            type="text"
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            onKeyDown={(e) => handleKeyPress(e, 'title')}
                                            onBlur={() => handleBlur('title')}
                                            className="popup-form__name-section-input"
                                            style={{flex: 1}}
                                            placeholder="Название заметки"
                                        />
                                        <small style={{color: '#666', fontSize: '12px'}}>
                                            Enter - сохранить, Esc - отмена
                                        </small>
                                    </div>
                                ) : (
                                    <h1 
                                        className="note-title"
                                        onDoubleClick={() => setIsEditingTitle(true)}
                                        style={{cursor: 'pointer'}}
                                        title="Двойной клик для редактирования"
                                    >
                                        {noteData.title || 'Без названия'}
                                    </h1>
                                )}
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

                    {/* Теги с редактированием */}
                    <div className="note-tags-section">
                        <h3 className="tags-title">
                            <span className="tags-icon"></span> Теги:
                        </h3>
                        {isEditingTags ? (
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <input
                                    ref={tagsInputRef}
                                    type="text"
                                    value={editedTags}
                                    onChange={(e) => setEditedTags(e.target.value)}
                                    onKeyDown={(e) => handleKeyPress(e, 'tags')}
                                    onBlur={() => handleBlur('tags')}
                                    className="popup-form__name-section-input"
                                    style={{flex: 1}}
                                    placeholder="тег1, тег2, тег3"
                                />
                                <small style={{color: '#666', fontSize: '12px'}}>
                                    Enter - сохранить, Esc - отмена
                                </small>
                            </div>
                        ) : (
                            <div 
                                className="note-tags"
                                onDoubleClick={() => setIsEditingTags(true)}
                                style={{cursor: 'pointer'}}
                                title="Двойной клик для редактирования тегов"
                            >
                                {tags.length > 0 ? (
                                    tags.map((tag, index) => (
                                        <span key={index} className="note-tag">
                                            #{tag}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{color: '#666', fontStyle: 'italic'}}>
                                        (двойной клик чтобы добавить теги)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Содержимое заметки с редактированием */}
                    <section className="note-content">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <h2 className="content-title">Содержимое:</h2>
                            {!isEditingContent && (
                                <button
                                    onClick={() => setIsEditingContent(true)}
                                    style={{
                                        background: 'none',
                                        border: '1px solid #ddd',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                    title="Редактировать содержимое"
                                >
                                    ✏️ Редактировать
                                </button>
                            )}
                        </div>
                        
                        {isEditingContent ? (
                            <div className="content-editor">
                                <div style={{position: 'relative'}}>
                                    <textarea
                                        ref={contentTextareaRef}
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        onKeyDown={(e) => handleKeyPress(e, 'content')}
                                        onBlur={() => handleBlur('content')}
                                        className="popup-form__description-section-input"
                                        rows="10"
                                        style={{width: '100%', marginBottom: '15px'}}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '20px',
                                        right: '10px',
                                        background: 'rgba(255,255,255,0.9)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#666'
                                    }}>
                                        Ctrl+Enter - сохранить, Esc - отмена
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div 
                                className="note-content-text"
                                onDoubleClick={() => setIsEditingContent(true)}
                                style={{cursor: 'pointer', minHeight: '100px'}}
                                title="Двойной клик для редактирования содержимого"
                            >
                                {noteData.content ? (
                                    <div className="content-paragraphs">
                                        {noteData.content.split('\n').map((paragraph, index) => (
                                            <p key={index} className="content-paragraph">
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-content" style={{color: '#666', fontStyle: 'italic'}}>
                                        (двойной клик чтобы добавить содержимое)
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <MobileHeader />
        </>
    );
}