**Live demo:** https://realtime-inventory-system.vercel.app/

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
- **One Active Reservation Per User** — enforced in the application layer (clean error
  message) and backed by a partial unique index in Postgres for airtight safety.
- **60-Second Expiry with Stock Recovery** — a background sweeper expires stale reservations,
  returns the reserved unit to available stock, and broadcasts the new count to all clients.
- **Cancellation** — users can cancel an active reservation instead of waiting out the
  window; the unit returns to stock immediately and everyone sees it live.
- **Reservation-Gated Purchases** — only the user holding the active reservation can purchase.
  Purchase and reservation completion are wrapped in a single database transaction with a
  row lock (`SELECT ... FOR UPDATE`).
- **Drop Creation API** — `POST /api/drops` initializes a drop with `availableStock` set
  server-side and `startsAt` timestamp for future drops; inputs are validated
  (positive stock, non-negative price).
- **Drop Activity Feed** — each card shows the 3 most recent distinct purchasers,
  deduplicated with Postgres `DISTINCT ON`, refreshed live via the `buyers_update` event.
- **UX Feedback** — loading states on all actions, toast notifications for conflicts
  (sold out, expired, duplicate reservation), a visible countdown timer, an error banner
  when the backend is unreachable, and a stock progress bar that turns amber on low stock
. Light/dark theme toggle.


## Documentation

- [Architecture decisions & concurrency handling](docs/ARCHITECTURE.md)
- [REST API & database schema](docs/API.md)


## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Database

Create the database and the partial unique index:

```sql
CREATE DATABASE sneaker_db;
```

Tables are created automatically by Sequelize's `sync()` on first start.

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





