import { create } from 'zustand'
import { fetchDrops, reserveDrop, purchaseReservation, cancelReservation  } from './api'
import { socket } from './socket'

interface Buyer {
  username: string
  createdAt: string
}

export interface Drop {
  id: number
  name: string
  price: string
  totalStock: number
  availableStock: number
  status: string
  recentBuyers: Buyer[]
}

interface Reservation {
  id: number
  dropId: number
  expiresAt: string
}

interface Store {
  drops: Drop[]
  userId: number
  reservation: Reservation | null
  loading: boolean
  error: string | null
  loadDrops: () => Promise<void>
  reserve: (dropId: number) => Promise<void>
  purchase: () => Promise<void>
  cancel: () => Promise<void>
  applyStockUpdate: (dropId: number, availableStock: number) => void
  applyBuyersUpdate: (dropId: number, recentBuyers: Buyer[]) => void
}

export const useStore = create<Store>((set) => ({
  drops: [],
 userId: Math.floor(Math.random() * 5) + 1,
  reservation: null,
  loading: false,
  error: null ,

  loadDrops: async () => {
    set({ loading: true, error: null })
    try {
      const drops = await fetchDrops()
      set({ drops, loading: false })
    } catch {
      set({ error: 'Could not reach the server. Is the backend running?', loading: false })
    }
  },

  reserve: async (dropId) => {
    const { userId } = useStore.getState()
    const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/drops/${dropId}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to reserve')
    set({ reservation: data.reservation })
  },

  purchase: async () => {
    const { userId, reservation } = useStore.getState()
    if (!reservation) return
    await purchaseReservation(reservation.id, userId)
    set({ reservation: null })
  },

    cancel: async () => {
    const { userId, reservation } = useStore.getState()
    if (!reservation) return
    await cancelReservation(reservation.id, userId)
    set({ reservation: null })
  },


  applyStockUpdate: (dropId, availableStock) => {
    set((state) => ({
      drops: state.drops.map((d) =>
        d.id === dropId ? { ...d, availableStock } : d
      ),
    }))
  },

  applyBuyersUpdate: (dropId, recentBuyers) => {
    set((state) => ({
      drops: state.drops.map((d) =>
        d.id === dropId ? { ...d, recentBuyers } : d
      ),
    }))
  },
}))


socket.on('stock_update', ({ dropId, availableStock }) => {
  useStore.getState().applyStockUpdate(dropId, availableStock)
})

socket.on('buyers_update', ({ dropId, recentBuyers }) => {
  useStore.getState().applyBuyersUpdate(dropId, recentBuyers)
})
