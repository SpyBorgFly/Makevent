import { Route, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { EventsPage } from "./pages/EventsPage";
import { FinancePage } from "./pages/FinancePage";
import { EventPage } from "./pages/EventPage";

function App() {
    return (
        <Routes>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="events/:eventId" element={<EventPage />} />
        </Routes>
    );
}

export default App;
