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
import { NDKEvent } from '@nostr-dev-kit/ndk'

export enum EventActionType {
  Create = 0,
  Delete = 1,
  Repost = 2,
  Quote = 3,
  Comment = 4,
  React = 5,
  Zap = 6,
}

export interface EventAction {
  type: EventActionType
  event?: NDKEvent
}

export interface EventContextProps {
  events: NDKEvent[]
  setEvents: Dispatch<SetStateAction<NDKEvent[]>>
  eventAction?: EventAction
  setEventAction: Dispatch<SetStateAction<EventAction | undefined>>
}

export const EventContext = createContext<EventContextProps>({
  events: [],
  setEvents: () => {},
  setEventAction: () => {},
})

export const EventContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [events, setEvents] = useState<NDKEvent[]>([])
  const [eventAction, setEventAction] = useState<EventAction>()
  const value = useMemo((): EventContextProps => {
    return {
      events,
      setEvents,
      eventAction,
      setEventAction,
    }
  }, [eventAction, events])

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}
