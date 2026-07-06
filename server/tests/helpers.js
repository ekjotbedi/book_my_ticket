// Shared test helpers: build the app and seed a known fixture into the
// (separate) test database.

import { db, resetSchema } from "../src/db/index.js";
import { hashPassword } from "../src/utils/auth.js";

/** Wipe and create a single event -> session -> 4 seats. Returns ids. */
export function seedFixture() {
  resetSchema();

  db.prepare(
    "INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)"
  ).run("seed@example.com", "Seed", hashPassword("password123"), "USER");

  const eventId = db
    .prepare(
      "INSERT INTO events (title, description, venue, category) VALUES (?, ?, ?, ?)"
    )
    .run("Test Event", "desc", "Test Venue", "Music").lastInsertRowid;

  const sessionId = db
    .prepare(
      "INSERT INTO sessions (event_id, starts_at, price_cents) VALUES (?, ?, ?)"
    )
    .run(eventId, new Date().toISOString(), 5000).lastInsertRowid;

  const seatIds = [];
  const insertSeat = db.prepare(
    "INSERT INTO seats (session_id, seat_row, number) VALUES (?, ?, ?)"
  );
  for (let n = 1; n <= 4; n++) {
    seatIds.push(insertSeat.run(sessionId, "A", n).lastInsertRowid);
  }

  return { eventId, sessionId, seatIds };
}
