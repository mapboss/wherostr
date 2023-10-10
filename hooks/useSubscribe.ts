import { NostrContext } from '@/contexts/NostrContext'
import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk'
import { nanoid } from 'nanoid'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNDK, useRelaySet } from './useNostr'

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
  alwaysShowNewItems: boolean = false,
  options?: {
    disabled?: boolean
    onStart?: (events: NDKEvent[]) => void
    onEvent?: (event: NDKEvent) => void
    onStop?: () => void
  },
) => {
  const ndk = useNDK()
  const relaySet = useRelaySet()
  const [sub, setSub] = useState<NDKSubscription>()
  const [items, setItems] = useState<NDKEvent[]>([])
  const [newItems, setNewItems] = useState<NDKEvent[]>([])
  const eos = useRef(false)

  useEffect(() => {
    if (!ndk) return
    if (!filter) return
    if (!relaySet) return
    // if (!filter || !relaySet) {
    //   setNewItems([])
    //   setItems([])
    //   return setSub((prev) => {
    //     prev?.removeAllListeners()
    //     prev?.stop()
    //     return undefined
    //   })
    // }
    console.log('sub:init', relaySet)
    setNewItems([])
    setItems([])
    eos.current = false
    setSub((prev) => {
      const subscribe = ndk.subscribe(
        filter,
        {
          closeOnEose: false,
          cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
          subId: nanoid(8),
        },
        relaySet,
        false,
      )
      prev?.removeAllListeners()
      prev?.stop()
      return subscribe
    })
  }, [ndk, relaySet, filter])

  useEffect(() => {
    if (!ndk || !sub) return
    console.log('sub:postCreate', sub)
    eos.current = false
    let evetns = new Map<string, NDKEvent>()

    const collectEvent = (item: NDKEvent) => {
      const dedupKey = item.deduplicationKey()
      const existingEvent = evetns.get(dedupKey)
      if (existingEvent) {
        item = dedupEvent(existingEvent, item)
      }
      item.ndk = ndk
      return { existingEvent, dedupKey, event: item }
    }

    const onEventDup = (item: NDKEvent) => {
      const { existingEvent, dedupKey, event } = collectEvent(item)
      evetns.set(dedupKey, event)
      if (eos.current) {
        if (!existingEvent) {
          setNewItems((prev) => sortItems([event, ...prev]))
        }
      } else {
        setItems(sortItems(evetns.values()))
      }
    }
    const onEvent = (item: NDKEvent) => {
      const { existingEvent, dedupKey, event } = collectEvent(item)
      evetns.set(dedupKey, event)
      if (eos.current) {
        if (!existingEvent) {
          setNewItems((prev) => sortItems([event, ...prev]))
        }
      } else {
        setItems(sortItems(evetns.values()))
      }
    }
    sub.on('show-new-items', (newItems: NDKEvent[]) => {
      newItems.forEach((ev) => {
        evetns.set(ev.deduplicationKey(), ev)
      })
      setItems(sortItems(evetns.values()))
      setNewItems([])
    })
    sub.on('event', onEvent)
    sub.on('event:dup', onEventDup)
    sub.once('eose', () => {
      eos.current = true
      // setItems(Array.from(items.values()))
    })
    sub.start()
    return () => {
      sub.removeAllListeners()
      sub.stop()
    }
  }, [sub, ndk])

  const oldestEvent = useMemo(() => items[items.length - 1], [items])
  const fetchMore = useCallback(async () => {
    if (!relaySet || !filter || !oldestEvent) return
    const { since, ...original } = filter
    const events = await ndk.fetchEvents(
      { ...original, until: oldestEvent.created_at, limit: 20 },
      { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
      relaySet,
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
  }, [relaySet, ndk, filter, oldestEvent])

  const showNewItems = useCallback(() => {
    if (!newItems.length) return
    sub?.emit('show-new-items', newItems)
    // setItems((prev) => sortItems([...newItems, ...prev]))
    // setNewItems([])
  }, [newItems, sub])

  useEffect(() => {
    if (!alwaysShowNewItems) return
    showNewItems()
  }, [alwaysShowNewItems, showNewItems])

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
