import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../api/client.js";
import { formatDate } from "../utils/format.js";
import Spinner from "../components/Spinner.jsx";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/events")
      .then((res) => setEvents(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading events..." />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Upcoming Events</h1>
      <p className="opacity-60 mb-6">Browse events and book your seats.</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => (
          <Link
            key={ev.id}
            to={`/events/${ev.id}`}
            className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow"
          >
            {ev.imageUrl && (
              <figure className="h-40 overflow-hidden">
                <img
                  src={ev.imageUrl}
                  alt={ev.title}
                  className="w-full h-full object-cover"
                />
              </figure>
            )}
            <div className="card-body">
              <div className="badge badge-secondary">{ev.category}</div>
              <h2 className="card-title">{ev.title}</h2>
              <p className="text-sm opacity-70">{ev.venue}</p>
              <p className="text-sm">
                {ev.nextSessionAt
                  ? `Next: ${formatDate(ev.nextSessionAt)}`
                  : "No upcoming sessions"}
              </p>
              <div className="card-actions justify-between items-center mt-2">
                <span className="text-xs opacity-60">
                  {ev.sessionCount} session{ev.sessionCount === 1 ? "" : "s"}
                </span>
                <span className="btn btn-primary btn-sm">View</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}