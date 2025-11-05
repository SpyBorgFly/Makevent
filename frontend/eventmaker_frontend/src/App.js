import React, { useState } from 'react';
import './App.css';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import TestAPI from './TestAPI';

function App() {
  const [refreshEvents, setRefreshEvents] = useState(false);

  const handleEventCreated = (newEvent) => {
    console.log('Новое событие создано:', newEvent);
    setRefreshEvents(!refreshEvents);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>EventMaker - Управление событиями</h1>
        <p>Создавайте и управляйте своими событиями</p>
      </header>
      
      <main className="App-main">
        <TestAPI />
        <div className="container">
          <EventForm onEventCreated={handleEventCreated} />
          <EventList key={refreshEvents} />
        </div>
      </main>
    </div>
  );
}

export default App;
