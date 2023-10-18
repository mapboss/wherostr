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
import {
  NDKNip07Signer,
  NDKSubscriptionCacheUsage,
  NDKUser,
} from '@nostr-dev-kit/ndk'
import { NostrContext, defaultRelays } from '@/contexts/NostrContext'

interface Account {
  user?: NDKUser
  signing: boolean
  follows: NDKUser[]
  signIn: () => Promise<NDKUser | void>
  signOut: () => Promise<void>
}

export const AccountContext = createContext<Account>({
  user: undefined,
  follows: [],
  signing: true,
  signIn: async () => {},
  signOut: async () => {},
})

export const AccountContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { ndk, relaySet, updateRelaySet, getUser } = useContext(NostrContext)
  const [signing, setSigning] = useState<boolean>(true)
  const [user, setUser] = useState<NDKUser>()
  const [follows, setFollows] = useState<NDKUser[]>([])
  const nostrRef = useRef<typeof window.nostr>(
    typeof window !== 'undefined' ? window.nostr : undefined,
  )
  nostrRef.current = typeof window !== 'undefined' ? window.nostr : undefined
  const hasNip7Extension = useCallback(() => {
    return !!nostrRef.current
  }, [nostrRef])

  const updateFollows = useCallback(async (user: NDKUser) => {
    const follows = await user.follows({
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    })
    setFollows(Array.from(follows))
  }, [])

  const signIn = useCallback(async () => {
    if (hasNip7Extension()) {
      ndk.signer = new NDKNip07Signer()
      const signerUser = await ndk.signer?.user()
      console.log('signIn:signerUser')
      if (signerUser) {
        const user = await getUser(signerUser.hexpubkey)
        if (user) {
          updateFollows(user)
          console.log('signIn:fetchFollows')
          localStorage.setItem(
            'session',
            JSON.stringify({ pubkey: user.hexpubkey, type: 'nip7' }),
          )
          updateRelaySet(user)
          console.log('signIn:updateRelaySet')
          setUser(user)
          return user
        }
      }
    }
  }, [hasNip7Extension, ndk, getUser, updateFollows, updateRelaySet])

  const signOut = useCallback(async () => {
    ndk.signer = undefined
    localStorage.removeItem('session')
    setUser(undefined)
    updateRelaySet()
  }, [ndk, updateRelaySet])

  const initUser = useCallback(async () => {
    try {
      setSigning(true)
      const session = JSON.parse(localStorage.getItem('session') || '{}')
      if (session?.pubkey) {
        if (session.type === 'nip7' && hasNip7Extension()) {
          await signIn()
          return
        }
      }
      updateRelaySet()
    } catch (err) {
    } finally {
      setSigning(false)
    }
  }, [hasNip7Extension, updateRelaySet, signIn])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (user || relaySet) return
    initUser()
  }, [user, relaySet, initUser])

  const value = useMemo((): Account => {
    return {
      user,
      follows,
      signing,
      signIn,
      signOut,
    }
  }, [user, follows, signing, signIn, signOut])

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}
