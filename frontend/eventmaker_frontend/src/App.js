import { Route, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { EventsPage } from "./pages/EventsPage";
import { FinancePage } from "./pages/FinancePage";
import { EventPage } from "./pages/EventPage";
import { NotesPage } from "./pages/NotesPage"
import { NotePage } from "./pages/NotePage";
import { useEffect } from 'react';
import { initTelegramAuth } from './services/telegramAuth';

function App() {
    useEffect(() => {
        // При запуске приложения пытаемся авторизоваться
        initTelegramAuth().then(token => {
            if (token) {
                console.log('✅ Успешная авторизация! Токен:', token);
            } else {
                console.log('ℹ️ Авторизация не удалась или не требуется');
            }
        });
    }, []);

    return (
        <Routes>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="events/:eventId" element={<EventPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="notes/:noteId" element={<NotePage />} />
        </Routes>
    );
}

export default App;
