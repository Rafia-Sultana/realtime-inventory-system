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

- `1` → the reservation is created with `expiresAt = now + 60s`, and the fresh stock count
  is re-read and broadcast to all clients
- `0` → the stock is gone; the user receives `409 Sold out`

The database itself is the source of truth — no application-level locks or in-memory
counters that could drift.

### 2. The 60-Second Expiry (Stock Recovery)

Reservations are not deleted on timeout — they are marked with a status and swept later.

- On reserve: `expiresAt = now + 60s`, `status = 'active'`, stock already decremented.
- A background sweeper (`setInterval`, every 10 seconds) runs inside a **transaction**:
  1. Finds all reservations where `status = 'active' AND expiresAt < now`
  2. For each, first flips the status to `expired` with a **conditional update**
     (`WHERE status = 'active'`) — if 0 rows are affected, another writer (a cancel or a
     purchase) won the race and the sweeper skips that reservation
  3. Only the winner increments the drop's stock
  4. Commits once, then emits a `stock_update` WebSocket event per affected drop

This guarantees a unit is never returned to stock twice, no matter how a cancellation,
purchase, and the sweeper interleave.

Trade-off: a 10-second sweep interval means an expired reservation may take up to ~70 seconds
to visually return to stock. A finer interval (or Postgres `LISTEN/NOTIFY` and per-row expiry)
would tighten this, but the single-transaction sweep keeps recovery itself race-free.

### 3. Purchases (Row Locks at the Boundary)

`POST /api/reservations/:id/purchase`:

1. Loads the reservation scoped by `id` **and** `userId`, with `SELECT ... FOR UPDATE`
   inside the transaction — the row is locked until commit, so the expiry sweeper cannot
   flip it mid-purchase
2. Rejects if `status !== 'active'` or `expiresAt` has passed (`409`)
3. Creates the purchase and flips the reservation to `completed` inside one transaction —
   either both happen or neither does
4. After commit, emits the updated top-3 buyer list to all clients

The `catch` block rolls back only if the transaction is still open, since post-commit
failures (e.g., broadcasting) must not attempt a rollback.

### 4. One Reservation Per User

A user can hold only one active reservation at a time. The check runs in the application
for a friendly `409` error, and a partial unique index enforces it at the database level
so even same-millisecond requests from multiple tabs cannot slip through:

```sql
CREATE UNIQUE INDEX one_active_reservation_per_user
ON reservations ("userId") WHERE status = 'active';
```

### 5. Cancellation (Beyond the Spec)

Users can cancel an active reservation instead of waiting out the window. Cancellation uses
the same conditional-update pattern — `WHERE status = 'active'` — so a cancel racing the
sweeper can never return the same unit to stock twice. If 0 rows are affected, the
reservation already expired or completed → `409`.

### 6. Buyer Feed Deduplication

A single user buying repeatedly would otherwise fill the "recent buyers" feed with their own
name. The feed uses Postgres `DISTINCT ON (username)` to keep only each user's latest
purchase, then takes the 3 most recent distinct purchasers.

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