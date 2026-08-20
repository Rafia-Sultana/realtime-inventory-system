const API_URL = import.meta.env.VITE_API_URL as string;


export async function fetchDrops() {
  const res = await fetch(`${API_URL}/drops`)
  if (!res.ok) throw new Error('Failed to fetch drops')
  return res.json()
}

export async function reserveDrop(dropId: number, userId: number) {
  const res = await fetch(`${API_URL}/drops/${dropId}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to reserve')
  return data.reservation

}

export async function purchaseReservation(reservationId: number, userId: number) {
  const res = await fetch(`${API_URL}/reservations/${reservationId}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to purchase')
}

export async function cancelReservation(reservationId: number, userId: number) {
  const res = await fetch(`${API_URL}/reservations/${reservationId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to cancel')
}
