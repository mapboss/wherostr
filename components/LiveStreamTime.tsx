import { useCallback, useEffect, useState } from 'react'
import { unixNow } from '@snort/shared'

export function LiveStreamTime({ starts }: { starts?: number }) {
  const [time, setTime] = useState('')

  const updateTime = useCallback(() => {
    const startsParsed = Number(starts ?? unixNow())
    const diff = unixNow() - startsParsed
    const min = 60
    const hour = min * 60

    const hours = Math.floor(diff / hour)
    const mins = Math.floor((diff % hour) / min)
    const secs = Math.floor(diff % min)
    setTime(
      `${hours.toFixed(0).padStart(2, '0')}:${mins
        .toFixed(0)
        .padStart(2, '0')}:${secs.toFixed(0).padStart(2, '0')}`,
    )
  }, [starts])

  useEffect(() => {
    updateTime()
    const t = setInterval(() => {
      updateTime()
    }, 1000)
    return () => clearInterval(t)
  }, [updateTime])

  return time
}
