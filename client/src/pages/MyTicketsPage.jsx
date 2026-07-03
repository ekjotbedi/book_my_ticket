import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../api/client.js";
import { formatDate, formatMoney } from "../utils/format.js";
import Spinner from "../components/Spinner.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

export default function MyTicketsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null); // booking pending cancellation
  const [cancelling, setCancelling] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/bookings/me")
      .then((res) => setBookings(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function requestCancel(booking) {
    setError("");
    setCancelTarget(booking);
  }

  function dismissCancel() {
    if (cancelling) return;
    setCancelTarget(null);
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.delete(`/bookings/${cancelTarget.id}`);
      setCancelTarget(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <Spinner label="Loading your tickets..." />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Tickets</h1>
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {bookings.length === 0 ? (
        <div className="text-center py-16">
          <p className="opacity-60 mb-4">You have no bookings yet.</p>
          <Link to="/" className="btn btn-primary">
            Browse events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h2 className="card-title">{b.eventTitle}</h2>
                    <p className="opacity-70 text-sm">{b.venue}</p>
                    <p className="opacity-70 text-sm">
                      {formatDate(b.startsAt)}
                    </p>
                  </div>
                  <div
                    className={`badge ${
                      b.status === "CONFIRMED" ? "badge-success" : "badge-ghost"
                    }`}
                  >
                    {b.status}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 my-2">
                  {b.seats.map((s) => (
                    <span key={s.id} className="badge badge-outline">
                      {s.row}
                      {s.number}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {formatMoney(b.totalCents)}
                  </span>
                  {b.status === "CONFIRMED" && (
                    <button
                      onClick={() => requestCancel(b)}
                      className="btn btn-outline btn-error btn-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Are you sure you want to cancel your tickets?"
        message={
          cancelTarget
            ? `${cancelTarget.eventTitle} — ${cancelTarget.seats
                .map((s) => `${s.row}${s.number}`)
                .join(", ")}`
            : ""
        }
        confirmLabel="Yes"
        cancelLabel="No"
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={dismissCancel}
      />
    </div>
  );
}