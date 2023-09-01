'use client'
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import NDK, { NDKUser } from '@nostr-dev-kit/ndk'

interface Nostr {
  ndk?: NDK
}

const ndk = new NDK({})

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
