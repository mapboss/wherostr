'use client'
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import NDK, { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk'
import { NostrContext } from './NostrContext'

export interface EventContextProps {
  fetchEvents: (filter?: NDKFilter<NDKKind>) => Promise<Set<NDKEvent>>
}

export const EventContext = createContext<EventContextProps>({
  fetchEvents: async () => new Set<NDKEvent>(),
})

export const EventContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { ndk } = useContext(NostrContext)

  const fetchEvents = useCallback(
    async (filter: NDKFilter<NDKKind> = {}) => {
      if (!ndk) return new Set<NDKEvent>()
      return ndk.fetchEvents(filter)
    },
    [ndk],
  )

  const value = useMemo((): EventContextProps => {
    return {
      fetchEvents,
    }
  }, [fetchEvents])

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}

export default EventContextProvider
