'use client'
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
} from 'react'
import NDK, { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk'
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'
import usePromise from 'react-use-promise'
import NodeCache from 'node-cache'
import { ErrorCode } from '@/constants/app'

interface Nostr {
  ndk: NDK
  connected: boolean
  getUser: (hexpubkey: string) => Promise<NDKUser | undefined>
  getEvent: (id: string) => Promise<NDKEvent | undefined>
}

const ndk = new NDK({
  cacheAdapter: new NDKCacheAdapterDexie({ dbName: 'wherostr-ndk-db' }),
  explicitRelayUrls: (process.env.NEXT_PUBLIC_RELAY_URLS || '')
    .split(',')
    .filter((item) => !!item),
})

export const NostrContext = createContext<Nostr>({
  ndk,
  connected: false,
  getUser: () => new Promise((resolve) => resolve(undefined)),
  getEvent: () => new Promise((resolve) => resolve(undefined)),
})

export const NostrContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const userCache = useMemo(
    () =>
      new NodeCache({
        stdTTL: 600,
        checkperiod: 600,
      }),
    [],
  )
  const eventCache = useMemo(
    () =>
      new NodeCache({
        stdTTL: 300,
        checkperiod: 300,
      }),
    [],
  )
  const [connected = false, error, state] = usePromise(async () => {
    await ndk.connect()
    return true
  }, [])
  const getUser = useCallback(
    async (hexpubkey: string) => {
      if (ndk) {
        let user: NDKUser | undefined | false = userCache.get(hexpubkey)
        if (!user && user !== false) {
          userCache.set(hexpubkey, false)
          user = ndk.getUser({ hexpubkey })
          await user.fetchProfile()
          if (user) {
            userCache.set(hexpubkey, user)
            return user
          } else {
            throw new Error(ErrorCode.EventNotFound)
          }
        } else if (user) {
          return user
        }
      }
    },
    [userCache],
  )
  const getEvent = useCallback(
    async (id: string) => {
      if (ndk) {
        let event: NDKEvent | undefined | null | false = eventCache.get(id)
        if (!event && event !== false) {
          eventCache.set(id, false)
          event = await ndk.fetchEvent(id)
          if (event) {
            eventCache.set(id, event)
            return event
          } else {
            throw new Error(ErrorCode.EventNotFound)
          }
        } else if (event) {
          return event
        }
      }
    },
    [eventCache],
  )
  const value = useMemo((): Nostr => {
    return {
      connected,
      ndk,
      getUser,
      getEvent,
    }
  }, [connected, getUser, getEvent])
  return <NostrContext.Provider value={value}>{children}</NostrContext.Provider>
}
