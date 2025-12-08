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
                    <h1>{dataEvent.title}</h1>
                    <p>{dataEvent.description}</p>
                </div>
            </main>
            <MobileHeader />
        </>
    );
}