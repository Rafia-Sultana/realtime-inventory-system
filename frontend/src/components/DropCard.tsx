import { useState } from 'react'
import toast from 'react-hot-toast'
import { useStore } from '../store'
import type { Drop as DropType } from '../store'
import { CountdownTimer } from './CountdownTimer'

interface Props {
  drop: DropType
}

export function DropCard({ drop }: Props) {
  const reserve = useStore((s) => s.reserve)
  const purchase = useStore((s) => s.purchase)
  const reservation = useStore((s) => s.reservation)
  const cancel = useStore((s) => s.cancel)
  const [cancelling, setCancelling] = useState(false)

  const userId = useStore((s) => s.userId)

  const [reserving, setReserving] = useState(false)
  const [buying, setBuying] = useState(false)

  const isMine = reservation?.dropId === drop.id
  const soldOut = drop.availableStock === 0

  async function handleReserve() {
    setReserving(true)
    try {
      await reserve(drop.id)
      toast.success('Reserved! Complete purchase within 60s')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reserve')
    } finally {
      setReserving(false)
    }
  }

  async function handleBuy() {
    setBuying(true)
    try {
      await purchase()
      toast.success('Purchase completed!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to purchase')
    } finally {
      setBuying(false)
    }
  }

    async function handleCancel() {
    setCancelling(true)
    try {
      await cancel()
      toast.success('Reservation cancelled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }


  const soldPercent = Math.round((drop.availableStock / drop.totalStock) * 100)
  const lowStock = drop.availableStock <= 5 && drop.availableStock > 0

     return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-indigo-500/10 transition-all">
      <div className="h-36 bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 relative flex items-center justify-center">
        <span className="text-5xl drop-shadow-lg">👟</span>
        <span className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white bg-black/30 backdrop-blur rounded-full px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          LIVE
        </span>
        <span className="absolute top-3 right-3 text-xs text-white bg-black/30 backdrop-blur rounded-full px-2.5 py-1 font-semibold">
          {drop.totalStock} units
        </span>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold leading-snug text-gray-700  dark:text-zinc-100">{drop.name}</h2>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
            ৳{Number(drop.price).toLocaleString()}
          </p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className={soldOut ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
              {soldOut ? 'Sold out' : `${drop.availableStock} available`}
            </span>
            <span className="text-slate-400 dark:text-slate-500">{soldPercent}% left</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                soldOut ? 'bg-red-500' : lowStock ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${soldPercent}%` }}
            />
          </div>
        </div>

        {drop.recentBuyers.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-slate-500">Recent:</span>
            {drop.recentBuyers.map((b) => (
              <span
                key={b.username + b.createdAt}
                className="text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 border border-indigo-100 dark:border-slate-700 rounded-full px-2 py-0.5"
              >
                {b.username}
              </span>
            ))}
          </div>
        )}

        {isMine ? (
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between bg-indigo-50 dark:bg-slate-800/70 border border-indigo-100 dark:border-indigo-500/30 rounded-lg px-3 py-2 text-sm">
              <span className="text-indigo-700 dark:text-indigo-300 font-medium">You reserved this</span>
              <CountdownTimer
                expiresAt={reservation!.expiresAt}
                onExpire={() => useStore.setState({ reservation: null })}
              />
            </div>
            <button
              onClick={handleBuy}
              disabled={buying}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors"
            >
              {buying ? 'Processing...' : 'Complete Purchase'}
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full bg-transparent border border-slate-300 dark:border-slate-700 hover:border-red-400 hover:text-red-500 text-slate-500 dark:text-slate-400 font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Cancel reservation'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleReserve}
            disabled={reserving || soldOut || reservation !== null}
            className="w-full mt-1 bg-indigo-400 hover:bg-indigo-500 hover:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            {reserving
              ? 'Reserving...'
              : soldOut
                ? 'Sold Out'
                : reservation !== null
                  ? 'Complete your reservation first'
                  : 'Reserve'}
          </button>
        )}
      </div>
    </div>
  )

}
