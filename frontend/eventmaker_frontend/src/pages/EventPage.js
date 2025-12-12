import { useParams } from "react-router";
import eventAPI from "../api";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { MobileHeader } from "../components/MobileHeader";

export function EventPage() {
    const { eventId } = useParams();
    const [dataEvent, setDataEvent] = useState(null);

    const fetchData = async (id) => {
        try {
            const response = await eventAPI.getEvent(id);
            return response;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    useEffect(() => {
        const loadData = async () => {
            if (eventId) {
                const data = await fetchData(eventId);
                setDataEvent(data);
            }
        };
        loadData();
    }, [eventId]);

    if (!dataEvent) {
        return <div>Загрузка...</div>;
    }

    return (
        <>
            <Header />
            <main className="main">
                <div className="main__container">
                    <div className="header-event__section">
                        <h1 className="event__title">{dataEvent.title}</h1>
                        <span className={`card-event-status ${dataEvent.status==='planned' ? 'error' : ""}`}>
                            {dataEvent.status==='planned' ? 'Планируется' : ""}
                            </span>
                    </div>

                    <section className="event__widget">
                        <div className="event__description-header">Описание:</div>
                        <p className="event__description">{dataEvent.description}</p>
                    </section>
                    <section className="task__widget">
                        <div className="task__header">
                            Задачи:
                        </div>
                        <div className="task__list">
                            
                        </div>
                    </section>
                </div>
            </main>
            <MobileHeader />
        </>
    );
}