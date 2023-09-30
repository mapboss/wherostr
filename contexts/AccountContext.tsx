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
  const { ndk, connected, getUser, connectRelays } = useContext(NostrContext)
  const [user, setUser] = useState<NDKUser>()
  const nostrRef = useRef<typeof window.nostr>()
  nostrRef.current = typeof window !== 'undefined' ? window.nostr : undefined
  useEffect(() => {
    if (!user) {
      connectRelays()
      return
    }
    user.relayList().then((relayList) => {
      if (relayList && relayList.readRelayUrls.length) {
        connectRelays(relayList.readRelayUrls)
      }
    })
  }, [user, connectRelays])
  useEffect(() => {
    if (ndk && nostrRef.current) {
      ndk.signer = new NDKNip07Signer()
    }
  }, [ndk])
  const signIn = useCallback(async () => {
    if (ndk && nostrRef.current) {
      const signerUser = await ndk.signer?.user()
      if (signerUser && connected) {
        const user = ndk.getUser({ hexpubkey: signerUser.hexpubkey })
        await user.fetchProfile()
        if (user) {
          localStorage.setItem('npub', user.npub)
          setUser(user)
        }
      }
    }
  }, [ndk, connected])
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
