'use client'
import {
  Dispatch,
  FC,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useMemo,
  useState,
} from 'react'
import { TaggedNostrEvent } from '@snort/system'


export interface EventContextProps {
  events: TaggedNostrEvent[]
  setEvents: Dispatch<SetStateAction<TaggedNostrEvent[]>>

}

export const EventContext = createContext<EventContextProps>({
  events: [],
  setEvents: () => { }

})

export const EventContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [events, setEvents] = useState<TaggedNostrEvent[]>([])

  const value = useMemo((): EventContextProps => {
    return {
      events,
      setEvents,
    }
  }, [events])

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}

