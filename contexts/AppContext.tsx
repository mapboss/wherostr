'use client'
import {
  Dispatch,
  FC,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import { ErrorCode } from '@/constants/app'
import { Alert, AlertProps, Snackbar, SnackbarProps } from '@mui/material'

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
export interface AppSnackbarProps extends SnackbarProps {
  slotProps?: { alert?: AlertProps }
}

export interface AppContextProps {
  profileAction?: ProfileAction
  setProfileAction: (profileAction?: ProfileActionOptions) => void
  events: NDKEvent[]
  setEvents: Dispatch<SetStateAction<NDKEvent[]>>
  eventAction?: EventAction
  setEventAction: (eventAction?: EventActionOptions) => void
  showSnackbar: (message: string, props?: AppSnackbarProps) => void
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
  const [{ slotProps, ...snackProps }, setSnackProps] =
    useState<AppSnackbarProps>({
      anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    })

  const setProfileAction = useCallback(
    async (profileAction?: ProfileActionOptions) => {
      if (!profileAction) {
        document.body.style.overflowY = ''
        _setProfileAction(undefined)
        return
      }
      try {
        document.body.style.overflowY = 'hidden'
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
        document.body.style.overflowY = ''
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
        document.body.style.overflowY = 'hidden'
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
    (message: string, props?: Omit<AppSnackbarProps, 'message'>) => {
      setSnackProps((prev) => ({
        ...prev,
        autoHideDuration: 5000,
        ...props,
        open: true,
        message,
      }))
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

  useEffect(() => {
    const wakeLockSwitch = document.querySelector('#wake-lock')

    let wakeLock: WakeLockSentinel | undefined

    const releaseHandle = () => {
      console.log('Wake Lock was released')
    }
    const requestWakeLock = async () => {
      try {
        wakeLock = await navigator.wakeLock.request('screen')
        wakeLock.addEventListener('release', releaseHandle)
        console.log('Wake Lock is active')
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`)
      }
    }

    const releaseWakeLock = () => {
      console.log('releasing wakeLock')

      wakeLock?.release()
      wakeLock = undefined
    }

    const checkWakeLockDetail = ({ detail }: any) => {
      const { checked } = detail
      checked ? requestWakeLock() : releaseWakeLock()
    }

    wakeLockSwitch?.addEventListener('change', checkWakeLockDetail)
    return () => {
      wakeLockSwitch?.removeEventListener('change', checkWakeLockDetail)
      wakeLock?.removeEventListener('release', releaseHandle)
    }
  }, [])
  return (
    <AppContext.Provider value={value}>
      {children}
      <Snackbar onClose={handleClose} {...snackProps}>
        <Alert
          {...slotProps?.alert}
          onClose={handleClose}
          severity={slotProps?.alert?.severity || 'warning'}
          sx={{ width: '100%' }}
        >
          {snackProps?.message}
        </Alert>
      </Snackbar>
    </AppContext.Provider>
  )
}
