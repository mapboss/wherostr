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
import { Dialog, DialogContent, DialogTitle, Modal } from '@mui/material'

interface Account {
  user?: NDKUser
  signIn: () => Promise<NDKUser | void>
  signOut: () => Promise<void>
}

export const AccountContext = createContext<Account>({
  user: undefined,
  signIn: async () => {},
  signOut: async () => {},
})

export const AccountContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { ndk, getUser, connectRelays } = useContext(NostrContext)
  const [user, setUser] = useState<NDKUser>()
  const nostrRef = useRef<typeof window.nostr>()
  nostrRef.current = typeof window !== 'undefined' ? window.nostr : undefined

  useEffect(() => {
    if (ndk && nostrRef.current) {
      ndk.signer = new NDKNip07Signer()
    }
  }, [ndk])

  const connect = useCallback(
    async (user?: NDKUser) => {
      if (!user) {
        return connectRelays()
      }
      return user.relayList().then((relayList) => {
        if (relayList?.readRelayUrls.length) {
          return connectRelays(relayList.readRelayUrls)
        }
      })
    },
    [connectRelays],
  )

  const signIn = useCallback(async () => {
    if (ndk && nostrRef.current) {
      const signerUser = await ndk.signer?.user()
      if (signerUser) {
        const user = ndk.getUser({ hexpubkey: signerUser.hexpubkey })
        const profile = await user.fetchProfile()
        if (profile) {
          user.profile = profile
        }
        if (user) {
          localStorage.setItem('npub', user.npub)
        }
        setUser(user)
        await connect(user)
        return user
      }
    }
  }, [ndk, connect])

  const signOut = useCallback(async () => {
    if (ndk && nostrRef.current) {
      ndk.signer = new NDKNip07Signer()
      localStorage.removeItem('npub')
      setUser(undefined)
      await connectRelays()
    }
  }, [ndk, connectRelays])
  const value = useMemo((): Account => {
    return {
      user,
      signIn,
      signOut,
    }
  }, [user, signIn, signOut])

  useEffect(() => {
    const func = async () => {
      let user: NDKUser | undefined
      if (localStorage.getItem('npub')) {
        const signerUser = await ndk.signer?.user()
        if (signerUser?.hexpubkey) {
          user = await getUser(signerUser.hexpubkey)
        }
      }
      await connect(user)
      if (user) {
        setUser(user)
      }
    }
    func()
  }, [getUser, connect, ndk.signer])

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}
