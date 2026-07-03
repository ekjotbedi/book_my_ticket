import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, errorMessage } from "../api/client.js";
import { formatDate, formatMoney } from "../utils/format.js";
import Spinner from "../components/Spinner.jsx";

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [selected, setSelected] = useState([]); // seat ids
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadSession() {
    setLoading(true);
    api
      .get(`/sessions/${id}`)
      .then((res) => setSession(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(loadSession, [id]);

  const seatRows = useMemo(() => {
    if (!session) return [];
    const groups = {};
    for (const seat of session.seats) {
      (groups[seat.row] ||= []).push(seat);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [session]);

  function toggleSeat(seat) {
    if (seat.taken) return;
    setSelected((prev) =>
      prev.includes(seat.id)
        ? prev.filter((s) => s !== seat.id)
        : [...prev, seat.id]
    );
  }

  async function handleBook() {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/bookings", {
        sessionId: Number(id),
        seatIds: selected,
      });
      navigate("/my-tickets");
    } catch (err) {
      setError(errorMessage(err));
      setSelected([]);
      loadSession();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner label="Loading seat map..." />;
  if (error && !session)
    return <div className="alert alert-error">{error}</div>;

  const total = (session.priceCents || 0) * selected.length;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-4">
        ← Back
      </button>

      <h1 className="text-2xl font-bold">{session.eventTitle}</h1>
      <p className="opacity-70 mb-1">{session.venue}</p>
      <p className="opacity-70 mb-6">
        {formatDate(session.startsAt)} · {formatMoney(session.priceCents)} per
        seat
      </p>

      {error && (
        <div className="alert alert-warning mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Screen indicator */}
      <div className="text-center mb-6">
        <div className="bg-base-300 rounded-box py-2 text-sm tracking-widest opacity-70">
          STAGE / SCREEN
        </div>
      </div>

      {/* Seat map */}
      <div className="flex flex-col items-center gap-2 mb-6">
        {seatRows.map(([row, seats]) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-5 text-sm opacity-50">{row}</span>
            {seats
              .sort((a, b) => a.number - b.number)
              .map((seat) => {
                const isSelected = selected.includes(seat.id);
                const cls = seat.taken
                  ? "btn-disabled bg-base-300"
                  : isSelected
                  ? "btn-primary"
                  : "btn-outline";
                return (
                  <button
                    key={seat.id}
                    className={`btn btn-sm btn-square ${cls}`}
                    onClick={() => toggleSeat(seat)}
                    disabled={seat.taken}
                    title={`Row ${seat.row}, Seat ${seat.number}`}
                  >
                    {seat.number}
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-sm mb-6">
        <span className="flex items-center gap-1">
          <span className="btn btn-xs btn-outline btn-square"></span> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="btn btn-xs btn-primary btn-square"></span> Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="btn btn-xs btn-disabled btn-square bg-base-300"></span>{" "}
          Taken
        </span>
      </div>

      {/* Summary bar */}
      <div className="sticky bottom-0 bg-base-100 shadow-lg rounded-box p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {selected.length} seat{selected.length === 1 ? "" : "s"} selected
          </p>
          <p className="text-sm opacity-70">Total: {formatMoney(total)}</p>
        </div>
        <button
          className="btn btn-primary"
          disabled={selected.length === 0 || submitting}
          onClick={handleBook}
        >
          {submitting && <span className="loading loading-spinner"></span>}
          Confirm booking
        </button>
      </div>
    </div>
  );
}
