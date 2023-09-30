'use client'
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
  useState,
} from 'react'
import NDK, {
  NDKEvent,
  NDKSubscriptionCacheUsage,
  NDKUser,
  NDKUserProfile,
} from '@nostr-dev-kit/ndk'
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'
import NodeCache from 'node-cache'
import { ErrorCode } from '@/constants/app'

interface Nostr {
  ndk: NDK
  connected: boolean
  connectRelays: (relays?: string[]) => void
  getUser: (hexpubkey: string) => Promise<NDKUser | undefined>
  getEvent: (id: string) => Promise<NDKEvent | undefined>
}

const defaultRelays = (process.env.NEXT_PUBLIC_RELAY_URLS || '')
  .split(',')
  .filter((item) => !!item)

const ndk = new NDK({
  cacheAdapter: new NDKCacheAdapterDexie({
    dbName: 'wherostr-ndk-db',
  }),
  explicitRelayUrls: defaultRelays,
})

export const NostrContext = createContext<Nostr>({
  ndk,
  connected: false,
  connectRelays: (relays?: string[]) => {},
  getUser: () => new Promise((resolve) => resolve(undefined)),
  getEvent: () => new Promise((resolve) => resolve(undefined)),
})
const userCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 600,
  useClones: true,
})

const eventCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 300,
  useClones: true,
})

export const NostrContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [connected, setConnected] = useState(false)

  // const [connected = false, error, state] = usePromise(async () => {
  //   await connectRelays(defaultRelays)
  //   return true
  // }, [])

  const connectRelays = useCallback(
    async (relays: string[] = defaultRelays) => {
      ndk.explicitRelayUrls = relays
      await ndk.connect()
      setConnected(true)
    },
    [],
  )

  const getUser = useCallback(async (hexpubkey: string) => {
    if (ndk) {
      const user = ndk.getUser({ hexpubkey })
      let profile: NDKUserProfile | undefined | false = userCache.get(hexpubkey)
      if (!profile) {
        const results = await user.fetchProfile()
        const values = results?.values()
        const result = values?.next()
        const profile = JSON.parse(result?.value?.content || '{}')
        user.profile = profile
        if (user.profile) {
          user.profile.displayName = profile.display_name
          user.profile.image = profile.picture
          userCache.set(hexpubkey, user.profile)
        }
        return user
      } else {
        user.profile = profile
        return user
      }
    }
  }, [])

  const getEvent = useCallback(async (id: string) => {
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
  }, [])

  const value = useMemo((): Nostr => {
    return {
      connected,
      ndk,
      connectRelays,
      getUser,
      getEvent,
    }
  }, [connected, connectRelays, getUser, getEvent])
  return <NostrContext.Provider value={value}>{children}</NostrContext.Provider>
}
