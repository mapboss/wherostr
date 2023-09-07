'use client'
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import NDK from '@nostr-dev-kit/ndk'

interface Nostr {
  ndk?: NDK
}

const ndk = new NDK({
  explicitRelayUrls: (process.env.NEXT_PUBLIC_RELAY_URLS || '')
    .split(',')
    .filter((item) => !!item),
})

export const NostrContext = createContext<Nostr>({
  ndk: undefined,
})

export const NostrContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const connect = useCallback(() => {
    return ndk.connect()
  }, [])
  useEffect(() => {
    connect()
  }, [connect])
  const value = useMemo((): Nostr => {
    return {
      ndk,
    }
  }, [])
  return <NostrContext.Provider value={value}>{children}</NostrContext.Provider>
}
