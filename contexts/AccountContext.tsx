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
import { EventPublisher, MetadataCache } from '@snort/system'
import { useUserProfile } from '@snort/system-react'

interface Account {
  user?: MetadataCache
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export const AccountContext = createContext<Account>({
  user: undefined,
  signIn: async () => { },
  signOut: async () => { },
})

export const AccountContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [pubKey, setPubKey] = useState<string>()
  const user = useUserProfile(pubKey)

  const createPublisher = useCallback(() => {
    return EventPublisher.nip7()
  }, [])

  const signIn = useCallback(async () => {
    const publisher = await createPublisher()
    if (publisher?.pubKey) {
      localStorage.setItem('npub', publisher.pubKey)
      setPubKey(publisher.pubKey)
    }
  }, [createPublisher])

  const signOut = useCallback(async () => {
    localStorage.removeItem('npub')
    setPubKey(undefined)

  }, [])
  const value = useMemo((): Account => {
    return {
      user,
      signIn,
      signOut,
    }
  }, [user, signIn, signOut])
  useEffect(() => {
    if (!localStorage) return
    if (localStorage.getItem('npub')) {
      signIn()
    }
  }, [signIn])
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}
