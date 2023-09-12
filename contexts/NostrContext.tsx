'use client'
import { FC, PropsWithChildren, createContext, useMemo } from 'react'
import NDK from '@nostr-dev-kit/ndk'
import usePromise from 'react-use-promise'

interface Nostr {
  ndk: NDK
  connected: boolean
}

const ndk = new NDK({
  explicitRelayUrls: (process.env.NEXT_PUBLIC_RELAY_URLS || '')
    .split(',')
    .filter((item) => !!item),
})

export const NostrContext = createContext<Nostr>({
  ndk,
  connected: false,
})

export const NostrContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [connected = false, error, state] = usePromise(async () => {
    await ndk.connect()
    return true
  }, [])
  const value = useMemo((): Nostr => {
    return {
      connected,
      ndk,
    }
  }, [connected])
  return <NostrContext.Provider value={value}>{children}</NostrContext.Provider>
}
