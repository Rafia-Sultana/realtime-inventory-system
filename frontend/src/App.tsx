import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useStore } from './store'
import { DropCard } from './components/DropCard'

function App() {
  const drops = useStore((s) => s.drops)
  const loading = useStore((s) => s.loading)
  const loadDrops = useStore((s) => s.loadDrops)
  const error = useStore((s) => s.error)
 

  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  function toggleTheme() {
    setDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  useEffect(() => {
    loadDrops()
  }, [loadDrops])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Toaster position="top-right" />

      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-indigo-600 dark:text-indigo-400">
              SNKRDROP
            </span>
          </h1>
          <button
            onClick={toggleTheme}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-full w-10 h-10 flex items-center justify-center text-lg transition-colors"
            title="Toggle theme"
          >
            {dark ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live drops — stock updates in real time
          </p>
        </div>

        {loading && (
          <p className="text-slate-500 dark:text-slate-400">Loading drops...</p>
        )}
        {error && (
          <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>
        )}

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
