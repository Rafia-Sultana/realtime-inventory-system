# SNKRDROP — Real-Time Sneaker Drop Inventory System

A full-stack inventory system for limited-edition sneaker drops. Users see live stock counts
across all connected tabs, can atomically reserve an item for 60 seconds, and complete their
purchase within that window. Unclaimed reservations expire automatically and the stock is
returned in real time.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Zustand, Tailwind CSS, Socket.io client, react-hot-toast |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Sequelize |
| Real-time | Socket.io |

## Features

- **Live Dashboard** — every drop's available stock updates instantly across all open tabs
  via WebSockets (no polling).
- **Atomic Reservations** — reserving decrements stock with a single conditional SQL
  `UPDATE`. When 100 users race for the last unit, exactly one succeeds; the rest get `409 Sold out`.
- **60-Second Expiry with Stock Recovery** — a background sweeper expires stale reservations,
  returns the reserved unit to available stock, and broadcasts the new count to all clients.
- **Reservation-Gated Purchases** — only the user holding the active reservation can purchase.
  Purchase and reservation completion are wrapped in a single database transaction.
- **Drop Creation API** — `POST /api/drops` initializes a drop with `availableStock` set
  server-side and an optional `startsAt` timestamp for future drops.
- **Drop Activity Feed** — each card shows the 3 most recent purchasers, refreshed live via
  the `buyers_update` WebSocket event.
- **UX Feedback** — loading states on all actions, toast notifications for conflicts
  (sold out, expired), a visible countdown timer, and a stock progress bar that turns
  amber on low stock and red on sell-out.

## Architecture Decisions

### 1. Preventing Overselling (The Race Condition)

The core concurrency problem: 100 users click Reserve at the same millisecond for 1 unit.
A read-then-write approach (`SELECT` the stock, check it, then `UPDATE`) would let multiple
requests pass the check before any of them writes.

Instead, the check and the write happen in **one atomic SQL statement**:

```sql
UPDATE drops
SET "availableStock" = "availableStock" - 1
WHERE id = :dropId AND "availableStock" > 0;
```

PostgreSQL takes a row lock while updating, so concurrent requests are serialized on that
row. Only requests that still find `availableStock > 0` match the `WHERE` clause and affect
a row. The application checks the affected-rows count:

- `1` → the reservation is created with `expiresAt = now + 60s`
- `0` → the stock is gone; the user receives `409 Sold out`

The database itself is the source of truth — no application-level locks or in-memory
counters that could drift.

### 2. The 60-Second Expiry (Stock Recovery)

Reservations are not deleted on timeout — they are marked with a status and swept later.

- On reserve: `expiresAt = now + 60s`, `status = 'active'`, stock already decremented.
- A background sweeper (`setInterval`, every 10 seconds) runs inside a **transaction**:
  1. Finds all reservations where `status = 'active' AND expiresAt < now`
  2. For each, increments the drop's stock atomically and marks the reservation `expired`
  3. Commits once, then emits a `stock_update` WebSocket event per affected drop

Trade-off: a 10-second sweep interval means an expired reservation may take up to ~70 seconds
to visually return to stock. A finer interval (or Postgres `LISTEN/NOTIFY` and per-row expiry)
would tighten this, but the single-transaction sweep keeps the recovery itself race-free:
if the user's purchase and the sweeper race at the boundary, whoever transitions the
reservation's status first wins, and the loser's conditional update affects 0 rows.

### 3. Purchases

`POST /api/reservations/:id/purchase`:

1. Loads the reservation scoped by `id` **and** `userId` — only the holder can buy
2. Rejects if `status !== 'active'` or `expiresAt` has passed (`409`)
3. Creates the purchase and flips the reservation to `completed` inside one transaction —
   either both happen or neither does
4. After commit, emits the updated top-3 buyer list to all clients

### 4. Cancel Support (Beyond the Spec)

Users can cancel an active reservation instead of waiting out the window. Cancellation uses
the same conditional-update pattern, so a cancel racing the sweeper can never return the
same unit to stock twice:

```sql
UPDATE reservations SET status = 'cancelled'
WHERE id = :id AND user_id = :userId AND status = 'active';
```

If 0 rows are affected, the reservation already expired or completed → `409`.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/drops` | Active drops, each with `recentBuyers` (latest 3 purchasers) |
| `POST` | `/api/drops` | Create a drop (name, price, totalStock, startsAt) |
| `POST` | `/api/drops/:id/reserve` | Atomically reserve 1 unit for 60s (body: `{ userId }`) |
| `POST` | `/api/reservations/:id/purchase` | Complete purchase of an active reservation |
| `POST` | `/api/reservations/:id/cancel` | Cancel an active reservation and restore stock |

### WebSocket Events (server → client)

| Event | Payload | When |
|---|---|---|
| `stock_update` | `{ dropId, availableStock }` | Any reserve, purchase-expiry recovery, or cancel |
| `buyers_update` | `{ dropId, recentBuyers }` | A successful purchase |

## Database Schema

```
users        (id, username UNIQUE, createdAt, updatedAt)

drops        (id, name, price DECIMAL(10,2), totalStock INT,
              availableStock INT, startsAt TIMESTAMP,
              status VARCHAR DEFAULT 'active', createdAt, updatedAt)

reservations (id, dropId FK → drops, userId FK → users,
              status ENUM('active','completed','expired','cancelled'),
              expiresAt TIMESTAMP, createdAt, updatedAt)

purchases    (id, dropId FK → drops, userId FK → users,
              reservationId FK → reservations, createdAt, updatedAt)
```

Notes:

- `price` uses `DECIMAL(10,2)` — never floating point for money.
- `availableStock` starts equal to `totalStock` and is only ever mutated by the atomic
  conditional updates described above.
- The reservations status enum encodes the full lifecycle: `active → completed | expired | cancelled`.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Database

Create the database:

```sql
CREATE DATABASE sneaker_db;
```

Tables are created automatically by Sequelize's `sync()` on first start, or via the seed step below.

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (never commit this file):

```
PORT=4000
DATABASE_URL=postgres://<user>:<password>@localhost:5432/sneaker_db
```

Optionally seed demo data (5 users, 3 drops):

```bash
npm run seed
```

Start the server:

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL (default `http://localhost:5173`). Open it in **two browser windows**
side by side to see real-time stock sync.

## Project Structure

```
backend/
  src/
    config/database.ts        Sequelize setup from DATABASE_URL
    controllers/              Route handlers (drops, reservations, purchases)
    models/                   User, Drop, Reservation, Purchase + associations
    routes/                   Express routers
    services/expiryService.ts 60s reservation expiry sweeper
    sockets/index.ts          Socket.io singleton + event emitters
    seed.ts                   Demo users and drops
frontend/
  src/
    api.ts                    REST wrappers
    socket.ts                 Socket.io client
    store.ts                  Zustand store + WebSocket event wiring
    components/               DropCard, CountdownTimer
```

