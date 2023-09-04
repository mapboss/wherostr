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
import dynamic from 'next/dynamic'

interface Account {
  publisher?: EventPublisher
  user?: MetadataCache
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export const AccountContext = createContext<Account>({
  publisher: undefined,
  user: undefined,
  signIn: async () => { },
  signOut: async () => { },
})

const AccountContextProviderComp: FC<PropsWithChildren> = ({ children }) => {
  const [publisher, setPublisher] = useState<EventPublisher>()
  const user = useUserProfile(publisher?.pubKey)

  const createPublisher = useCallback(() => {
    return EventPublisher.nip7()
  }, [])

  const signIn = useCallback(async () => {
    const publisher = await createPublisher()
    if (publisher?.pubKey) {
      localStorage.setItem('npub', publisher.pubKey)
      setPublisher(publisher)
    }
  }, [createPublisher])

  const signOut = useCallback(async () => {
    localStorage.removeItem('npub')
    setPublisher(undefined)
  }, [])
  const value = useMemo((): Account => {
    return {
      publisher,
      user,
      signIn,
      signOut,
    }
  }, [publisher, user, signIn, signOut])
  useEffect(() => {
    if (localStorage.getItem('npub')) {
      signIn()
    }
  }, [signIn])
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}

export const AccountContextProvider = dynamic(
  () => new Promise<FC<PropsWithChildren>>((resolve) => resolve(AccountContextProviderComp)),
  { ssr: false },
)
