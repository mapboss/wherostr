'use client'
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { NDKUser } from '@nostr-dev-kit/ndk'

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

export const AccountContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [user, setUser] = useState<NDKUser | undefined>(undefined)
  const signIn = useCallback(async () => {
    // await signIn
    // setUser
  }, [])
  const signOut = useCallback(async () => {
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
