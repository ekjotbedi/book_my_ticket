# 🎟️ TicketHub — Event Ticket Booking Platform

A full-stack event ticketing app where users browse events, pick seats from an
interactive seat map, and book them where the same seat can not be double-booked- enforced by a database
`UNIQUE` constraint inside a SQL transaction.

**Stack:** React · Vite · Tailwind CSS · DaisyUI · Node.js · Express · SQL
(better-sqlite3 / SQLite) · JWT auth · Jest + Supertest · OpenAPI/Swagger

---

## Why this project

Booking systems share the hard problem- real-world backends face:
**two users must not be able to claim the same resource at the same time.** This
project solves it the correct way — at the data layer, not with fragile
application-level checks:

1. `tickets.seat_id` has a **`UNIQUE` constraint**.
2. A booking is written inside a **single SQL transaction** (all seats commit
   together or none do).
3. If a seat is already taken, its `INSERT` fails the constraint, the whole
   transaction **rolls back**, and the API returns **`409 Conflict`**.

There's a dedicated test that fires **8 concurrent requests for one seat** and
asserts exactly one succeeds and seven get `409`.
[`server/tests/concurrency.test.js`](server/tests/concurrency.test.js)

---

## Features

- **Browse events** with live seat-availability and capacity bars
- **Interactive seat map** (select/deselect, taken seats disabled)
- **JWT authentication** (register / login, protected routes)
- **My Tickets** — view and cancel bookings (cancelling frees the seat)
- **Concurrency-safe booking** with atomic transactions
- **Capacity tracking** via SQL aggregate queries
- **Swagger API docs**
- **13 passing tests** (integration + concurrency)

---

## Architecture

```
client/  React + Vite + Tailwind + DaisyUI
   │  calls /api/*
   ▼
server/  Express REST API
   routes → controllers → services → raw SQL (better-sqlite3)
                                        │
                                        ▼
                                   SQLite database
                          (UNIQUE constraint + transactions)
```

The backend uses a clean **layered architecture** — routes delegate to
controllers (HTTP concerns + validation), which call services (business logic +
SQL). All database access is hand-written SQL.

---

## How to compile the program

Requirement: Node.js 18+, Two terminals (one for the API, one for the UI).

### Terminal1: Backend (API)
```bash
cd server
npm install
npm run setup
npm run dev       # API on http://localhost:4000
```

### Terminal2: Frontend (UI)
```bash
cd client
npm install
npm run dev       # UI on http://localhost:5173
```

Open **http://localhost:5173** and log in with the pre-filled demo account:

```
email:    demo@example.com
password: password123
```

---

## Running the tests

```bash
cd server
npm test
```

```
PASS tests/concurrency.test.js
PASS tests/api.test.js
Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
```

---

## API reference

Base URL: `http://localhost:4000/api` · Interactive docs: `/api/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account, returns JWT |
| POST | `/auth/login` | Log in, returns JWT |
| GET | `/auth/me` | Current user |
| GET | `/events` | List events + session counts |
| GET | `/events/:id` | Event detail + sessions + availability |
| GET | `/sessions/:id` | Session detail + full seat map |
| POST | `/bookings` | Book seats (atomic, returns `409` on conflict) |
| GET | `/bookings/me` | My bookings / tickets |
| DELETE | `/bookings/:id` | Cancel a booking (unassign seats) |

---

## Data model
```
events ──1:N── sessions ──1:N── seats ──1:1── tickets ──N:1── bookings ──N:1── users
```
Defined in raw SQL: [`server/src/db/schema.sql`].
The one-to-one `seats ↔ tickets` relationship (via `UNIQUE(seat_id)`) is what
makes double-booking impossible.

---