'use client'
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { NDKNip07Signer, NDKUser } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'

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
  const { ndk, getUser } = useContext(NostrContext)
  const [user, setUser] = useState<NDKUser>()
  const nostrRef = useRef<typeof window.nostr>()
  nostrRef.current = typeof window !== 'undefined' ? window.nostr : undefined

  useEffect(() => {
    if (ndk && nostrRef.current) {
      ndk.signer = new NDKNip07Signer()
    }
  }, [ndk])
  const signIn = useCallback(async () => {
    if (ndk && nostrRef.current) {
      const signerUser = await ndk.signer?.user()
      if (signerUser) {
        const _user = await getUser(signerUser.hexpubkey)
        if (_user) {
          localStorage.setItem('npub', _user.npub)
          setUser(_user)
        }
      }
    }
  }, [ndk, getUser])
  const signOut = useCallback(async () => {
    if (ndk && nostrRef.current) {
      ndk.signer = new NDKNip07Signer()
      localStorage.removeItem('npub')
      setUser(undefined)
    }
  }, [ndk])
  const value = useMemo((): Account => {
    return {
      user,
      signIn,
      signOut,
    }
  }, [user, signIn, signOut])
  useEffect(() => {
    if (localStorage.getItem('npub')) {
      signIn()
    }
  }, [signIn])
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}
