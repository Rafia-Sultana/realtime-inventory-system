import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useStore } from './store'
import { DropCard } from './components/DropCard'

function App() {
  const drops = useStore((s) => s.drops)
  const loading = useStore((s) => s.loading)
  const userId = useStore((s) => s.userId)
  const loadDrops = useStore((s) => s.loadDrops)

  useEffect(() => {
    loadDrops()
  }, [loadDrops])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
        }}
      />

      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              SNKRDROP
            </span>
          </h1>
          <span className="text-sm bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
            Signed in as <span className="font-semibold text-violet-300">user {userId}</span>
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <p className="text-sm text-slate-400">Live drops — stock updates in real time</p>
        </div>

        {loading && <p className="text-slate-400">Loading drops...</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {drops.map((drop) => (
            <DropCard key={drop.id} drop={drop} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
