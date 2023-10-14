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
import { Alert, Snackbar, SnackbarProps } from '@mui/material'

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
  hexpubkey: string
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
  showSnackbar: (
    message: string,
    props?: Omit<SnackbarProps, 'message'>,
  ) => void
  hideSnackbar: () => void
}

export const AppContext = createContext<AppContextProps>({
  setProfileAction: () => {},
  events: [],
  setEvents: () => {},
  setEventAction: () => {},
  showSnackbar: () => {},
  hideSnackbar: () => {},
})

export const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { getEvent } = useContext(NostrContext)
  const [profileAction, _setProfileAction] = useState<ProfileAction>()
  const [events, setEvents] = useState<NDKEvent[]>([])
  const [eventAction, _setEventAction] = useState<EventAction>()
  const [snackProps, setSnackProps] = useState<SnackbarProps>({
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
  })

  const setProfileAction = useCallback(
    async (profileAction?: ProfileActionOptions) => {
      if (!profileAction) {
        _setProfileAction(undefined)
        return
      }
      try {
        _setProfileAction({
          ...profileAction,
          hexpubkey: profileAction.hexpubkey,
        })
        _setEventAction(undefined)
      } catch (error) {
        console.log('error', error)
      }
    },
    [],
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

  const handleClose = useCallback(
    (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return
      }
      setSnackProps((prev) => ({ ...prev, open: false }))
    },
    [],
  )
  const showSnackbar = useCallback(
    (message: string, props?: Omit<SnackbarProps, 'message'>) => {
      setSnackProps((prev) => ({ ...prev, ...props, open: true, message }))
    },
    [],
  )
  const hideSnackbar = useCallback(() => {
    handleClose()
  }, [handleClose])

  const value = useMemo((): AppContextProps => {
    return {
      profileAction,
      setProfileAction,
      events,
      setEvents,
      eventAction,
      setEventAction,
      showSnackbar,
      hideSnackbar,
    }
  }, [
    profileAction,
    setProfileAction,
    events,
    eventAction,
    setEventAction,
    showSnackbar,
    hideSnackbar,
  ])

  return (
    <AppContext.Provider value={value}>
      {children}
      <Snackbar onClose={handleClose} {...snackProps}>
        <Alert onClose={handleClose} severity="warning" sx={{ width: '100%' }}>
          {snackProps?.message}
        </Alert>
      </Snackbar>
    </AppContext.Provider>
  )
}
