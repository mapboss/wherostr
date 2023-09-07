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
  const { ndk } = useContext(NostrContext)
  const [user, setUser] = useState<NDKUser>()
  useEffect(() => {
    if (ndk) {
      ndk.signer = new NDKNip07Signer()
    }
  }, [ndk])
  const signIn = useCallback(async () => {
    if (ndk) {
      const signerUser = await ndk.signer?.user()
      if (signerUser) {
        const _user = ndk.getUser({
          npub: signerUser.npub,
        })
        await _user.fetchProfile()
        localStorage.setItem('npub', _user.npub)
        setUser(_user)
      }
    }
  }, [ndk])
  const signOut = useCallback(async () => {
    if (ndk) {
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
    if (ndk) {
      if (localStorage.getItem('npub')) {
        signIn()
      }
    }
  }, [ndk, signIn])
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}
