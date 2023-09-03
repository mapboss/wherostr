'use client'
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'

export interface EventContextProps {
  events: NDKEvent[]
  fetchEvents: (filter?: NDKFilter<NDKKind>) => Promise<Set<NDKEvent>>
}

export const EventContext = createContext<EventContextProps>({
  events: [],
  fetchEvents: async () => new Set<NDKEvent>(),
})

export const EventContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { ndk } = useContext(NostrContext)
  const [events, setEvents] = useState<NDKEvent[]>([])

  const fetchEvents = useCallback(
    async (filter: NDKFilter<NDKKind> = {}) => {
      if (!ndk) {
        const emptyEvent = new Set<NDKEvent>()
        setEvents(Array.from(emptyEvent))
        return emptyEvent
      }
      return ndk.fetchEvents(filter).then((response) => {
        setEvents(Array.from(response))
        return response
      })
    },
    [ndk],
  )

  const value = useMemo((): EventContextProps => {
    return {
      events,
      fetchEvents,
    }
  }, [events, fetchEvents])

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}

export default EventContextProvider
