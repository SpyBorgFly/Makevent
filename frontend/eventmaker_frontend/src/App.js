import { Route, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { EventsPage } from "./pages/EventsPage";

function App() {
  return (
    <Routes>
        <Route index  element={<HomePage />} />
        <Route path="events" element={<EventsPage />} />
    </Routes>
  );
}

export default App;
