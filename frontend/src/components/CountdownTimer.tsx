import { useEffect, useState } from 'react'

interface Props {
  expiresAt: string
  onExpire: () => void
}

export function CountdownTimer({ expiresAt, onExpire }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
      )
      setSecondsLeft(left)
      if (left === 0) onExpire()
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  return (
       <span className={secondsLeft <= 10 ? 'text-red-600 dark:text-red-400 font-bold' : 'font-semibold'}>

      {secondsLeft}s
    </span>
  )
}
