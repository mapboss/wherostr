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
import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import { ErrorCode } from '@/constants/app'

export enum ProfileActionType {
  View = 0,
}
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

export interface ProfileAction {
  type: ProfileActionType
  user: NDKUser
  options?: any
}
export interface ProfileActionOptions {
  type: ProfileActionType
  hexpubkey: string
  options?: any
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
  profileAction?: ProfileAction
  setProfileAction: (profileAction?: ProfileActionOptions) => void
  events: NDKEvent[]
  setEvents: Dispatch<SetStateAction<NDKEvent[]>>
  eventAction?: EventAction
  setEventAction: (eventAction?: EventActionOptions) => void
}

export const AppContext = createContext<AppContextProps>({
  setProfileAction: () => {},
  events: [],
  setEvents: () => {},
  setEventAction: () => {},
})

export const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { getUser, getEvent } = useContext(NostrContext)
  const [profileAction, _setProfileAction] = useState<ProfileAction>()
  const [events, setEvents] = useState<NDKEvent[]>([])
  const [eventAction, _setEventAction] = useState<EventAction>()
  const setProfileAction = useCallback(
    async (profileAction?: ProfileActionOptions) => {
      if (!profileAction) {
        _setProfileAction(undefined)
        return
      }
      try {
        const user = await getUser(profileAction.hexpubkey)
        if (!user) {
          throw new Error(ErrorCode.ProfileNotFound)
        }
        _setProfileAction({
          ...profileAction,
          user,
        })
        _setEventAction(undefined)
      } catch (error) {
        console.log('error', error)
      }
    },
    [getUser],
  )
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
        _setProfileAction(undefined)
      } catch (error) {
        console.log('error', error)
      }
    },
    [getEvent],
  )
  const value = useMemo((): AppContextProps => {
    return {
      profileAction,
      setProfileAction,
      events,
      setEvents,
      eventAction,
      setEventAction,
    }
  }, [profileAction, setProfileAction, events, eventAction, setEventAction])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
