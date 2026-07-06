// Seed the database with demo events, sessions, seats and a test user.
// Idempotent-ish: it resets the schema first so re-running gives a clean set.
//   npm run seed   (or: npm run setup)

import { db, resetSchema } from "./index.js";
import { hashPassword } from "../utils/auth.js";

const EVENTS = [
  {
    title: "Diljit Dosanjh Live Concert",
    description: "Enjoy an evening full of music, vibe and energy with Diljit.",
    venue: "Rogers Centre, Toronto, ON",
    category: "Concert",
    imageUrl: "/images/diljit.jpg",
    sessions: [
      { inDays: 3, hour: 18, price: 9000 },   // Fri Jul 3 @ 6:00 PM — $90
      { inDays: 6, hour: 12, price: 9000 },    // Mon Jul 6 @ 12:00 PM — $90
    ],
  },
  {
    title: "Russell Peters Stand-Up Comedy",
    description: "Take a break from life and laugh with Russell Peters.",
    venue: "Nathan Phillips Square, Toronto, ON",
    category: "Comedy",
    imageUrl: "/images/russell-peters.jpg",
    sessions: [
      { inDays: 7, hour: 17, price: 5500 },    // Tues Jul 7 @ 5:00 PM — $55
      { inDays: 16, hour: 19, price: 5500 },   // Thurs Jul 16 @ 7:00 PM — $55
    ],
  },
  {
    title: "Candlelight Concert",
    description: "One-of-a-kind concerts, played with flickering candle lights.",
    venue: "St. Paul's Church, Toronto, ON",
    category: "Music",
    imageUrl: "/images/candlelight.jpg",
    sessions: [
      { inDays: 15, hour: 18, price: 6000 },   // Wed Jul 15 @ 6:00 PM — $60
      { inDays: 19, hour: 14, price: 6000 },   // Sun Jul 19 @ 2:00 PM — $60
    ],
  },
  {
    title: "Ink the 6ix Toronto Tattoo Expo",
    description: "The massive expo will bring together global tattoo artists for live tattooing and art shows.",
    venue: "Enercare, Toronto, ON",
    category: "Art",
    imageUrl: "/images/tattoo.jpg",
    sessions: [
      { inDays: 16, hour: 18, price: 6000 },   // Thu Jul 16 @ 6:00 PM — $60
      { inDays: 20, hour: 14, price: 6000 },   // Mon Jul 20 @ 2:00 PM — $60
    ],
  },
  {
    title: "Bassi's Stand-Up Comedy",
    description: "This season laugh yourself out with Bassi.",
    venue: "Massey Hall, Toronto, ON",
    category: "Comedy",
    imageUrl: "/images/bassi.jpg",
    sessions: [
      { inDays: 26, hour: 16, price: 4500 },   // Sat Jul 25 @ 4:00 PM — $45
      { inDays: 27, hour: 20, price: 4500 },   // Mon Jul 27 @ 8:00 PM — $45
    ],
  },
  {
    title: "World Cup of Soccer Watch party",
    description: "Want someone to watch the tournament with..? We got you!",
    venue: "Toronto Public Library, Toronto, ON",
    category: "Sports",
    imageUrl: "/images/fifa.jpg",
    sessions: [
      { inDays: 15, hour: 15, price: 1000 },   // Wed Jul 15 @ 3:00 PM — $10
    ],
  },
  {
    title: "Toy Story Trivia Night",
    description: "Let's test your Pixar knowledge",
    venue: "Snakes & Lattes Annex, Toronto, ON",
    category: "Disney",
    imageUrl: "/images/toyStory.jpg",
    sessions: [
      { inDays: 8, hour: 19, price: 1000 },   // Wed Jul 8 @ 7:00 PM — $10
    ],
  },
  {
    title: "The Art of the Brick",
    description: "The best-known LEGO art exhibition is now in your city.",
    venue: "30 Hanover Road, North York, ON",
    category: "LEGO",
    imageUrl: "/images/lego.jpg",
    sessions: [
      { inDays: 32, hour: 17, price: 3500 },   // Tues Jul 28 @ 5:00 PM — $35
    ],
  },
];

// Each session gets a small grid of seats: rows A-D, numbers 1-6 (24 seats).
const ROWS = ["A", "B", "C", "D"];
const SEATS_PER_ROW = 6;

function startsAt(inDays, hour) {
  const d = new Date();
  d.setDate(d.getDate() + inDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const seed = db.transaction(() => {
  resetSchema();

  // Demo user for quick login.
  db.prepare(
    "INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)"
  ).run("demo@example.com", "Demo User", hashPassword("password123"), "USER");

  const insertEvent = db.prepare(
    "INSERT INTO events (title, description, venue, category, image_url) VALUES (?, ?, ?, ?, ?)"
  );
  const insertSession = db.prepare(
    "INSERT INTO sessions (event_id, starts_at, price_cents) VALUES (?, ?, ?)"
  );
  const insertSeat = db.prepare(
    "INSERT INTO seats (session_id, seat_row, number) VALUES (?, ?, ?)"
  );

  for (const ev of EVENTS) {
    const eventId = insertEvent.run(
      ev.title,
      ev.description,
      ev.venue,
      ev.category,
      ev.imageUrl
    ).lastInsertRowid;

    for (const s of ev.sessions) {
      const sessionId = insertSession.run(
        eventId,
        startsAt(s.inDays, s.hour),
        s.price
      ).lastInsertRowid;

      for (const row of ROWS) {
        for (let n = 1; n <= SEATS_PER_ROW; n++) {
          insertSeat.run(sessionId, row, n);
        }
      }
    }
  }
});

seed();

const counts = {
  users: db.prepare("SELECT COUNT(*) c FROM users").get().c,
  events: db.prepare("SELECT COUNT(*) c FROM events").get().c,
  sessions: db.prepare("SELECT COUNT(*) c FROM sessions").get().c,
  seats: db.prepare("SELECT COUNT(*) c FROM seats").get().c,
};
console.log("Seeded database:", counts);
console.log("Demo login -> email: demo@example.com  password: password123");