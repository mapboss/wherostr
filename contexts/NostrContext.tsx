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
} from '@nostr-dev-kit/ndk'
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'

interface Nostr {
  ndk: NDK
  connected: boolean
  connectRelays: (relays?: string[]) => void
  getUser: (hexpubkey: string) => Promise<NDKUser | undefined>
  getEvent: (id: string) => Promise<NDKEvent | null>
}

const defaultRelays = (process.env.NEXT_PUBLIC_RELAY_URLS || '')
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
  connectRelays: (relays?: string[]) => {},
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
      ndk.explicitRelayUrls = relays
      setConnected(false)
      await ndk.connect()
      setConnected(true)
    },
    [],
  )

  const getUser = useCallback(async (hexpubkey: string) => {
    const user = ndk.getUser({ hexpubkey })
    const profile = await user.fetchProfile({
      closeOnEose: true,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    })
    if (profile) {
      user.profile = profile
    }
    return user
  }, [])

  const getEvent = useCallback(async (id: string) => {
    return ndk.fetchEvent(id, {
      closeOnEose: true,
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
