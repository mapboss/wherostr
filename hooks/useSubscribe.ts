import { NostrContext } from '@/contexts/NostrContext'
import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

export type SubscribeResult = [
  NDKEvent[],
  () => Promise<NDKEvent[] | undefined>,
  NDKEvent[],
  () => void,
]

const sortItems = (
  items: NDKEvent[] | Set<NDKEvent> | IterableIterator<NDKEvent>,
) => {
  return Array.from(items).sort((a, b) => b.created_at! - a.created_at!)
}

export const useSubscribe = (
  filter?: NDKFilter<NDKKind>,
  options?: {
    disabled?: boolean
    onStart?: (events: NDKEvent[]) => void
    onEvent?: (event: NDKEvent) => void
    onStop?: () => void
  },
) => {
  const { ndk, connected } = useContext(NostrContext)
  const [sub, setSub] = useState<NDKSubscription>()
  const [items, setItems] = useState<NDKEvent[]>([])
  const [newItems, setNewItems] = useState<NDKEvent[]>([])
  const eos = useRef(false)

  useEffect(() => {
    if (!connected) return
    if (!filter) {
      setItems([])
      return setSub((prev) => {
        prev?.removeAllListeners()
        prev?.stop()
        return undefined
      })
    }
    setItems([])
    eos.current = false
    const subscribe = ndk.subscribe(
      filter,
      { closeOnEose: false, cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
      undefined,
      false,
    )
    setSub((prev) => {
      prev?.removeAllListeners()
      prev?.stop()
      return subscribe
    })
  }, [ndk, connected, filter])

  useEffect(() => {
    if (!connected || !sub) return
    eos.current = false
    const items = new Map<string, NDKEvent>()

    const collectEvent = (item: NDKEvent) => {
      const dedupKey = item.deduplicationKey()
      const existingEvent = items.get(dedupKey)
      if (existingEvent) {
        item = dedupEvent(existingEvent, item)
      }
      item.ndk = ndk
      items.set(dedupKey, item)
    }

    const onEventDup = (item: NDKEvent) => {
      collectEvent(item)
      if (eos.current) {
        setItems(sortItems(items.values()))
      }
    }
    const onEvent = (item: NDKEvent) => {
      collectEvent(item)
      if (eos.current) {
        setNewItems(sortItems(items.values()))
      }
    }
    sub.on('event', onEvent)
    sub.on('event:dup', onEventDup)
    sub.once('eose', () => {
      eos.current = true
      setItems(sortItems(items.values()))
    })
    sub.start()
    return () => {
      sub.removeAllListeners()
      sub.stop()
    }
  }, [connected, sub, ndk])

  const oldestEvent = useMemo(() => items[items.length - 1], [items])
  const fetchMore = useCallback(async () => {
    if (!connected || !filter || !oldestEvent) return
    const { since, ...original } = filter
    const events = await ndk.fetchEvents(
      { ...original, until: oldestEvent.created_at, limit: 20 },
      { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
    )
    const items = sortItems(events)
    let nonDupItems: NDKEvent[] = []
    setItems((prev) => {
      nonDupItems = items.filter(
        (item) =>
          !prev.find((d) => d.deduplicationKey() === item.deduplicationKey()),
      )
      return [...prev, ...nonDupItems]
    })
    return nonDupItems
  }, [connected, ndk, filter, oldestEvent])

  const showNewItems = useCallback(() => {
    setItems((prev) => sortItems([...newItems, ...prev]))
  }, [newItems])

  return useMemo<SubscribeResult>(() => {
    return [items, fetchMore, newItems, showNewItems]
  }, [items, fetchMore, newItems, showNewItems])
}

export function dedupEvent(event1: NDKEvent, event2: NDKEvent) {
  // return the newest of the two
  if (event1.created_at! > event2.created_at!) {
    return event1
  }

  return event2
}
