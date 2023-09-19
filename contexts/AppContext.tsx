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
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import { ErrorCode } from '@/constants/app'

export enum EventActionType {
  Create = 0,
  Delete = 1,
  Repost = 2,
  Quote = 3,
  Comment = 4,
  React = 5,
  Zap = 6,
  View = 7,
}

export interface EventAction {
  type: EventActionType
  event?: NDKEvent
  options?: any
}
export interface EventActionOptions {
  type: EventActionType
  event?: NDKEvent | string
  options?: any
}

export interface AppContextProps {
  events: NDKEvent[]
  setEvents: Dispatch<SetStateAction<NDKEvent[]>>
  eventAction?: EventAction
  setEventAction: (eventAction?: EventActionOptions) => void
}

export const AppContext = createContext<AppContextProps>({
  events: [],
  setEvents: () => {},
  setEventAction: () => {},
})

export const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { getEvent } = useContext(NostrContext)
  const [events, setEvents] = useState<NDKEvent[]>([])
  const [eventAction, _setEventAction] = useState<EventAction>()
  const setEventAction = useCallback(
    async (eventAction?: EventActionOptions) => {
      if (!eventAction) {
        _setEventAction(undefined)
        return
      }
      try {
        let event = eventAction.event
        if (typeof event === 'string') {
          const _event = await getEvent(event)
          if (!_event) {
            throw new Error(ErrorCode.EventNotFound)
          }
          event = _event
        }
        _setEventAction({
          ...eventAction,
          event,
        })
      } catch (error) {
        console.log('error', error)
      }
    },
    [getEvent],
  )
  const value = useMemo((): AppContextProps => {
    return {
      events,
      setEvents,
      eventAction,
      setEventAction,
    }
  }, [eventAction, events, setEventAction])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
