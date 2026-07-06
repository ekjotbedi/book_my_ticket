-- ---------------------------------------------------------------------------
-- Event Ticket Booking Platform - database schema (raw SQL)
-- ---------------------------------------------------------------------------
-- Relational model:
--   events 1---* sessions 1---* seats 1---? tickets *---1 bookings *---1 users
--
-- The concurrency guarantee is enforced HERE, in the schema:
--   tickets.seat_id is UNIQUE, so a single seat can be tied to at most one
--   ticket. Combined with a transaction in the booking service, two concurrent
--   requests for the same seat cannot both succeed - the second INSERT fails
--   with a UNIQUE constraint violation and the whole booking rolls back.
-- ---------------------------------------------------------------------------

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    NOT NULL UNIQUE,
    name       TEXT    NOT NULL,
    password   TEXT    NOT NULL,                 -- bcrypt hash
    role       TEXT    NOT NULL DEFAULT 'USER',  -- USER | ADMIN
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    venue       TEXT    NOT NULL,
    category    TEXT    NOT NULL DEFAULT 'General',
    image_url   TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    starts_at   TEXT    NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seats (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    seat_row   TEXT    NOT NULL,
    number     INTEGER NOT NULL,
    -- A session cannot define the same physical seat twice.
    UNIQUE (session_id, seat_row, number)
);

CREATE TABLE IF NOT EXISTS bookings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    status      TEXT    NOT NULL DEFAULT 'CONFIRMED',  -- CONFIRMED | CANCELLED
    total_cents INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tickets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id    INTEGER NOT NULL UNIQUE REFERENCES seats(id) ON DELETE CASCADE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Indexes mirroring how the API filters/joins the data.
CREATE INDEX IF NOT EXISTS idx_sessions_event   ON sessions (event_id);
CREATE INDEX IF NOT EXISTS idx_seats_session     ON seats (session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user     ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session  ON bookings (session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_booking   ON tickets (booking_id);
