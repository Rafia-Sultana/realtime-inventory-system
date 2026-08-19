import { useEffect } from 'react'
import { useStore } from './store'
import './socket'

function App() {
  const drops = useStore((s) => s.drops)
  const loadDrops = useStore((s) => s.loadDrops)

  useEffect(() => {
    loadDrops()
  }, [loadDrops])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sneaker Drop</h1>
      {drops.map((drop) => (
        <div key={drop.id} className="mb-2">
          {drop.name} — {drop.availableStock} left
        </div>
      ))}
    </div>
  )
}

export default App
