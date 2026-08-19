# API Documentation

## REST Endpoints

| Method | Path                              | Description
|--------|---------------------------------- |-----------------------------------------------------------------------|
| `GET`  | `/api/drops`                      | Active drops, each with `recentBuyers` (3 latest distinct purchasers) |
| `POST` | `/api/drops`                      | Create a drop (name, price, totalStock, startsAt) |
| `POST` | `/api/drops/:id/reserve`          | Atomically reserve 1 unit for 60s (body: `{ userId }`) |
| `POST` | `/api/reservations/:id/purchase`  | Complete purchase of an active reservation |
| `POST` | `/api/reservations/:id/cancel`    | Cancel an active reservation and restore stock |

Errors are explicit: `400` invalid input or unknown user, `404` resource not found,
`409` conflicts (sold out, already reserved, expired, not active), `500` unexpected.

## WebSocket Events (server → client)

| Event          | Payload                      | When |
|----------------|------------------------------|------|
| `stock_update` | `{ dropId, availableStock }` | Any reserve, expiry recovery, or cancel |
| `buyers_update`| `{ dropId, recentBuyers }`   | A successful purchase |

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

INDEX one_active_reservation_per_user ON reservations(userId) WHERE status = 'active'
```
