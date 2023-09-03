'use client'
import {
  Dispatch,
  FC,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { NDKEvent, NDKFilter, NDKKind, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'

export interface EventContextProps {
  fetching: boolean;
  fetchEvents: (filter?: NDKFilter<NDKKind> | NDKFilter<NDKKind>[]) => Promise<NDKEvent[]>
  events: NDKEvent[]
  setEvents: Dispatch<SetStateAction<NDKEvent[]>>

}

export const EventContext = createContext<EventContextProps>({
  fetching: false,
  fetchEvents: async () => [],
  events: [],
  setEvents: () => { }

})

export const EventContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { ndk } = useContext(NostrContext)
  const [events, setEvents] = useState<NDKEvent[]>([])
  const [fetching, setFetching] = useState<boolean>(false)

  const fetchEvents = useCallback(
    async (filter: NDKFilter<NDKKind> | NDKFilter<NDKKind>[] = {}) => {
      let events: NDKEvent[] = []
      try {
        if (ndk) {
          const result = await ndk.fetchEvents(filter)
          events = Array.from(result)
        } else {
          const emptyEvent = new Set<NDKEvent>()
          events = Array.from(emptyEvent)
        }
      } catch (err) {
        console.error('fetchEvents', err)
      } finally {
        setFetching(false)
      }
      return events
    },
    [ndk],
  )

  const value = useMemo((): EventContextProps => {
    return {
      fetching,
      events,
      setEvents,
      fetchEvents,
    }
  }, [fetching, events, fetchEvents])

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}

export default EventContextProvider
