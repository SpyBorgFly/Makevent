import { Route, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { EventsPage } from "./pages/EventsPage";
import { FinancePage } from "./pages/FinancePage";

function App() {
    return (
        <Routes>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="finance" element={<FinancePage />} />
        </Routes>
    );
}

export default App;
