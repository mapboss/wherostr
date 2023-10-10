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
  NDKRelay,
  NDKSubscriptionCacheUsage,
  NDKUser,
} from '@nostr-dev-kit/ndk'
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'

interface Nostr {
  ndk: NDK
  connected: boolean
  connectRelays: (relays?: string[]) => Promise<void>
  getUser: (
    hexpubkey: string,
    relayUrls?: string[],
  ) => Promise<NDKUser | undefined>
  getEvent: (id: string) => Promise<NDKEvent | null>
}

export const defaultRelays = (process.env.NEXT_PUBLIC_RELAY_URLS || '')
  .split(',')
  .filter((item) => !!item)

const dexieAdapter = new NDKCacheAdapterDexie({ dbName: 'wherostr-cache' })
const ndk = new NDK({
  cacheAdapter: dexieAdapter as any,
  explicitRelayUrls: defaultRelays,
})

export const NostrContext = createContext<Nostr>({
  ndk,
  connected: false,
  connectRelays: async (relays?: string[]) => {},
  getUser: () => new Promise((resolve) => resolve(undefined)),
  getEvent: () => new Promise((resolve) => resolve(null)),
})

export const NostrContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [connected, setConnected] = useState(false)

  // const [connected = false, error, state] = usePromise(async () => {
  //   await connectRelays(defaultRelays)
  //   return true
  // }, [])

  const connectRelays = useCallback(
    async (relays: string[] = defaultRelays) => {
      setConnected(false)
      ndk.explicitRelayUrls?.forEach((e) => {
        if (relays.includes(e)) return
        new NDKRelay(e).disconnect()
      })
      ndk.explicitRelayUrls = relays
      await ndk.connect()
      setConnected(true)
    },
    [],
  )

  const getUser = useCallback(
    async (hexpubkey: string, relayUrls: string[] = defaultRelays) => {
      const user = ndk.getUser({
        hexpubkey,
        relayUrls: connected ? undefined : relayUrls,
      })
      const profile = await user.fetchProfile({
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      })
      if (profile) {
        user.profile = profile
      }
      return user
    },
    [connected],
  )

  const getEvent = useCallback(async (id: string) => {
    return ndk.fetchEvent(id, {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    })
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
