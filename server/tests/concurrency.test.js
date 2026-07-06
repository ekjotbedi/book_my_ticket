// The flagship test: prove the same seat can never be double-booked.
//
// We fire many booking requests for the SAME seat "at once" with Promise.all.
// Exactly one must succeed (201); every other must be rejected with 409
// Conflict. This validates the UNIQUE(seat_id) constraint + transaction guard.

import request from "supertest";
import { createApp } from "../src/app.js";
import { seedFixture } from "./helpers.js";

const app = createApp();

async function tokenFor(email) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, name: "Racer", password: "password123" });
  return res.body.token;
}

describe("Concurrency: no double-booking", () => {
  test("only one of many concurrent requests for one seat succeeds", async () => {
    const { sessionId, seatIds } = seedFixture();
    const targetSeat = seatIds[0];

    // 8 different users all race for the same single seat.
    const tokens = await Promise.all(
      Array.from({ length: 8 }, (_, i) => tokenFor(`racer${i}@example.com`))
    );

    const responses = await Promise.all(
      tokens.map((token) =>
        request(app)
          .post("/api/bookings")
          .set("Authorization", `Bearer ${token}`)
          .send({ sessionId, seatIds: [targetSeat] })
      )
    );

    const created = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    expect(created).toHaveLength(1);
    expect(conflicts).toHaveLength(7);

    // The seat is now taken exactly once.
    const session = await request(app).get(`/api/sessions/${sessionId}`);
    const seat = session.body.seats.find((s) => s.id === targetSeat);
    expect(seat.taken).toBe(true);
    expect(session.body.availableSeats).toBe(3);
  });

  test("partial overlap: booking [A1,A2] then [A2,A3] -> second fails, A3 stays free", async () => {
    const { sessionId, seatIds } = seedFixture();
    const token = await tokenFor("overlap@example.com");

    const first = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ sessionId, seatIds: [seatIds[0], seatIds[1]] });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ sessionId, seatIds: [seatIds[1], seatIds[2]] });
    expect(second.status).toBe(409);

    // Because the whole booking rolled back, seat #3 must remain available.
    const session = await request(app).get(`/api/sessions/${sessionId}`);
    expect(session.body.availableSeats).toBe(2); // only A1, A2 taken
  });
});
