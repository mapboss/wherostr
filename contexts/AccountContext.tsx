'use client'
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { NDKUser } from '@nostr-dev-kit/ndk'
import { NostrContext } from './NostrContext'

interface Account {
  user?: NDKUser
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export const AccountContext = createContext<Account>({
  user: undefined,
  signIn: async () => {},
  signOut: async () => {},
})

export const AccountContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { ndk } = useContext(NostrContext)
  const [user, setUser] = useState<NDKUser | undefined>(undefined)
  useEffect(() => {
    console.log('ndk', ndk)
    if (ndk) {
      const npup = localStorage.getItem('npup')
      if (npup) {
      }
    }
  }, [ndk])
  const signIn = useCallback(async () => {
    // await signIn
    localStorage.setItem('npup', '')
    // setUser
  }, [])
  const signOut = useCallback(async () => {
    localStorage.removeItem('npup')
    // await signOut
    // setUser
  }, [])
  const value = useMemo((): Account => {
    return {
      user,
      signIn,
      signOut,
    }
  }, [user, signIn, signOut])
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}
