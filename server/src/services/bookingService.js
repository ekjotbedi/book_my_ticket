// Booking service - contains the concurrency-safe seat-booking logic.
//
// HOW DOUBLE-BOOKING IS PREVENTED
// --------------------------------
// 1. tickets.seat_id has a UNIQUE constraint (see schema.sql).
// 2. The whole booking is created inside a single SQL transaction
//    (better-sqlite3's db.transaction). All ticket INSERTs either commit
//    together or roll back together.
// 3. If a seat is already ticketed, its INSERT throws a UNIQUE constraint
//    error; we abort the transaction (nothing is half-booked) and return a
//    409 Conflict. Two concurrent requests for the same seat can never both
//    succeed.

import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const isUniqueViolation = (err) =>
  err && typeof err.code === "string" && err.code.startsWith("SQLITE_CONSTRAINT");

/**
 * Create a confirmed booking for the given seats.
 * @returns the created booking with its seats.
 */
export function createBooking({ userId, sessionId, seatIds }) {
  // Reject duplicate seat ids in the same request up-front.
  if (new Set(seatIds).size !== seatIds.length) {
    throw ApiError.badRequest("Duplicate seat ids in request");
  }

  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
  if (!session) throw ApiError.notFound("Session not found");

  // Every requested seat must exist and belong to this session.
  const getSeat = db.prepare("SELECT id, session_id FROM seats WHERE id = ?");
  for (const seatId of seatIds) {
    const seat = getSeat.get(seatId);
    if (!seat || seat.session_id !== sessionId) {
      throw ApiError.badRequest(`Seat ${seatId} does not belong to this session`);
    }
  }

  const total = session.price_cents * seatIds.length;
  const insertBooking = db.prepare(
    "INSERT INTO bookings (user_id, session_id, total_cents) VALUES (?, ?, ?)"
  );
  const insertTicket = db.prepare(
    "INSERT INTO tickets (booking_id, seat_id) VALUES (?, ?)"
  );

  // The atomic transaction. Returns the new booking id, or throws.
  const runBooking = db.transaction(() => {
    const bookingInfo = insertBooking.run(userId, sessionId, total);
    const bookingId = bookingInfo.lastInsertRowid;
    for (const seatId of seatIds) {
      insertTicket.run(bookingId, seatId); // UNIQUE(seat_id) guards us here
    }
    return bookingId;
  });

  let bookingId;
  try {
    bookingId = runBooking();
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw ApiError.conflict(
        "One or more selected seats have already been booked"
      );
    }
    throw err;
  }

  return getBookingById(bookingId, userId);
}

/** Fetch a single booking (must belong to the user) with its seats. */
export function getBookingById(bookingId, userId) {
  const booking = db
    .prepare(
      `SELECT b.id, b.status, b.total_cents AS totalCents, b.created_at AS createdAt,
              s.id AS sessionId, s.starts_at AS startsAt,
              e.title AS eventTitle, e.venue AS venue
       FROM bookings b
       JOIN sessions s ON s.id = b.session_id
       JOIN events e   ON e.id = s.event_id
       WHERE b.id = ? AND b.user_id = ?`
    )
    .get(bookingId, userId);
  if (!booking) throw ApiError.notFound("Booking not found");

  booking.seats = db
    .prepare(
      `SELECT seat.id, seat.seat_row AS row, seat.number
       FROM tickets t
       JOIN seats seat ON seat.id = t.seat_id
       WHERE t.booking_id = ?
       ORDER BY seat.seat_row, seat.number`
    )
    .all(bookingId);

  return booking;
}

/** All bookings for a user ("My Tickets"). */
export function listMyBookings(userId) {
  const bookings = db
    .prepare(
      `SELECT b.id, b.status, b.total_cents AS totalCents, b.created_at AS createdAt,
              s.id AS sessionId, s.starts_at AS startsAt,
              e.title AS eventTitle, e.venue AS venue
       FROM bookings b
       JOIN sessions s ON s.id = b.session_id
       JOIN events e   ON e.id = s.event_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`
    )
    .all(userId);

  const seatsStmt = db.prepare(
    `SELECT seat.id, seat.seat_row AS row, seat.number
     FROM tickets t
     JOIN seats seat ON seat.id = t.seat_id
     WHERE t.booking_id = ?
     ORDER BY seat.seat_row, seat.number`
  );
  for (const b of bookings) b.seats = seatsStmt.all(b.id);
  return bookings;
}

/** Cancel a booking: delete its tickets (freeing the seats) and mark cancelled. */
export function cancelBooking(bookingId, userId) {
  const booking = db
    .prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ?")
    .get(bookingId, userId);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.status === "CANCELLED") {
    throw ApiError.badRequest("Booking is already cancelled");
  }

  const cancel = db.transaction(() => {
    db.prepare("DELETE FROM tickets WHERE booking_id = ?").run(bookingId);
    db.prepare("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?").run(
      bookingId
    );
  });
  cancel();

  return { id: bookingId, status: "CANCELLED" };
}
