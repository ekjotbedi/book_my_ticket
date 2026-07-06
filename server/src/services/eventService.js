// Event/Session catalogue service - raw SQL with JOINs and aggregate counts
// to compute live seat availability (capacity tracking).

import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

/** List all events with their number of sessions and earliest start. */
export function listEvents() {
  return db
    .prepare(
      `SELECT e.id, e.title, e.description, e.venue, e.category, e.image_url AS imageUrl,
              COUNT(s.id)        AS sessionCount,
              MIN(s.starts_at)   AS nextSessionAt
       FROM events e
       LEFT JOIN sessions s ON s.event_id = e.id
       GROUP BY e.id
       ORDER BY e.title`
    )
    .all();
}

/** A single event with all of its sessions and per-session availability. */
export function getEvent(eventId) {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
  if (!event) throw ApiError.notFound("Event not found");

  const sessions = db
    .prepare(
      `SELECT s.id, s.starts_at AS startsAt, s.price_cents AS priceCents,
              COUNT(seat.id)                         AS totalSeats,
              COUNT(seat.id) - COUNT(t.id)           AS availableSeats
       FROM sessions s
       LEFT JOIN seats seat   ON seat.session_id = s.id
       LEFT JOIN tickets t    ON t.seat_id = seat.id
       WHERE s.event_id = ?
       GROUP BY s.id
       ORDER BY s.starts_at`
    )
    .all(eventId);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    venue: event.venue,
    category: event.category,
    imageUrl: event.image_url,
    sessions,
  };
}

/** Session detail including every seat and whether it is taken. */
export function getSessionWithSeats(sessionId) {
  const session = db
    .prepare(
      `SELECT s.id, s.starts_at AS startsAt, s.price_cents AS priceCents,
              e.id AS eventId, e.title AS eventTitle, e.venue AS venue
       FROM sessions s
       JOIN events e ON e.id = s.event_id
       WHERE s.id = ?`
    )
    .get(sessionId);
  if (!session) throw ApiError.notFound("Session not found");

  const seats = db
    .prepare(
      `SELECT seat.id, seat.seat_row AS row, seat.number,
              CASE WHEN t.id IS NULL THEN 0 ELSE 1 END AS taken
       FROM seats seat
       LEFT JOIN tickets t ON t.seat_id = seat.id
       WHERE seat.session_id = ?
       ORDER BY seat.seat_row, seat.number`
    )
    .all(sessionId)
    .map((s) => ({ ...s, taken: Boolean(s.taken) }));

  const availableSeats = seats.filter((s) => !s.taken).length;

  return { ...session, totalSeats: seats.length, availableSeats, seats };
}
