import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../api/client.js";
import { formatDate, formatMoney } from "../utils/format.js";
import Spinner from "../components/Spinner.jsx";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <Link to="/" className="btn btn-ghost btn-sm mb-4">
        ← Back to events
      </Link>

      <div className="card bg-base-100 shadow-md mb-6">
        {event.imageUrl && (
          <figure className="relative h-72 sm:h-96 overflow-hidden">
            {/* Blurred, scaled-up backdrop fills the space attractively */}
            <img
              src={event.imageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-70"
            />
            <div className="absolute inset-0 bg-base-100/30"></div>
            {/* Sharp, uncropped image on top so the whole picture is visible */}
            <img
              src={event.imageUrl}
              alt={event.title}
              className="relative w-full h-full object-contain drop-shadow-lg"
            />
          </figure>
        )}
        <div className="card-body">
          <div className="badge badge-secondary">{event.category}</div>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="opacity-70">{event.venue}</p>
          <p className="mt-2">{event.description}</p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-3">Sessions</h2>
      <div className="space-y-3">
        {event.sessions.map((s) => {
          const soldOut = s.availableSeats === 0;
          return (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 bg-base-100 p-4 rounded-box shadow-sm"
            >
              <div>
                <p className="font-medium">{formatDate(s.startsAt)}</p>
                <p className="text-sm opacity-70">
                  {formatMoney(s.priceCents)} · {s.availableSeats}/{s.totalSeats}{" "}
                  seats available
                </p>
              </div>
              <div className="flex items-center gap-2">
                <progress
                  className="progress progress-primary w-32 hidden sm:block"
                  value={s.totalSeats - s.availableSeats}
                  max={s.totalSeats}
                ></progress>
                {soldOut ? (
                  <span className="badge badge-error badge-lg">Sold out</span>
                ) : (
                  <Link
                    to={`/sessions/${s.id}/book`}
                    className="btn btn-primary btn-sm"
                  >
                    Select seats
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}