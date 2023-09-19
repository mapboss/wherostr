import { NostrContext } from '@/contexts/NostrContext'
import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
} from '@nostr-dev-kit/ndk'
import { useContext, useEffect, useState } from 'react'
import usePromise from 'react-use-promise'

export const useSubscribe = (
  filter: NDKFilter<NDKKind> = {},
  options?: {
    disabled?: boolean
    onStart?: (events: NDKEvent[]) => void
    onEvent?: (event: NDKEvent) => void
    onStop?: () => void
  },
) => {
  const { disabled, onStart, onEvent, onStop } = options || {}
  const { ndk } = useContext(NostrContext)
  const [sub, setSub] = useState<NDKSubscription>()
  const [items, setItems] = useState<NDKEvent[]>([])

  const [events, eventError, eventState] = usePromise(async () => {
    if (disabled) return []
    const items = await ndk.fetchEvents(filter)
    return Array.from(items).sort((a, b) => {
      if (b.kind !== 30311) {
        return (b.created_at || 0) - (a.created_at || 0)
      }
      const startsA = Number(a.tagValue('starts') || a.created_at)
      const startsB = Number(b.tagValue('starts') || b.created_at)
      return startsB - startsA
    })
  }, [disabled, filter])

  useEffect(() => {
    if (!filter || eventState !== 'resolved') {
      setItems([])
      return setSub((prev) => {
        prev?.stop()
        return undefined
      })
    }
    setItems(events)
    const { since, until, ...old } = filter
    const subscribe = ndk.subscribe(
      { ...old, since: Math.round(Date.now() / 1000) },
      { closeOnEose: false },
      undefined,
      false,
    )
    setSub((prev) => {
      prev?.stop()
      return subscribe
    })
  }, [ndk, eventState, events, filter])

  useEffect(() => {
    if (sub && disabled) {
      sub.stop()
      onStop?.()
    }
  }, [disabled, sub, onStop])

  useEffect(() => {
    if (disabled || !sub || eventState !== 'resolved') return
    const items = new Set<NDKEvent>(events)
    onStart?.(events)
    sub.on('event', (item: NDKEvent) => {
      if (items.has(item)) return
      items.add(item)
      onEvent?.(item)
      setItems((prev) => {
        if (item.kind !== 30311) {
          return [item, ...prev].slice(0, 10000)
        }
        const index = prev.findIndex(
          (d) => d.tagValue('d') === item.tagValue('d'),
        )
        if (index === -1) {
          return [item, ...prev].slice(0, 10000).sort((a, b) => {
            const startsA = Number(a.tagValue('starts') || a.created_at)
            const startsB = Number(b.tagValue('starts') || b.created_at)
            return startsB - startsA
          })
        }
        return [...prev.slice(0, index), item, ...prev.slice(index + 1)]
          .slice(0, 10000)
          .sort((a, b) => {
            const startsA = Number(a.tagValue('starts') || a.created_at)
            const startsB = Number(b.tagValue('starts') || b.created_at)
            return startsB - startsA
          })
      })
    })
    sub.start()
    return () => {
      sub.stop()
      onStop?.()
    }
  }, [sub, eventState, events, disabled, onStart, onEvent, onStop])

  return items
}
