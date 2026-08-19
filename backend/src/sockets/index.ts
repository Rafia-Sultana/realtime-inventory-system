import { Server } from 'socket.io'

let io: Server

export function initSocket(server: Server) {
  io = server
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

export function emitStockUpdate(dropId: number, availableStock: number) {
  getIO().emit('stock_update', { dropId, availableStock })
}

export function emitBuyersUpdate(dropId: number, recentBuyers: { username: string; createdAt: Date }[]) {
  getIO().emit('buyers_update', { dropId, recentBuyers })
}
