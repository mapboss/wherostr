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
  follows: NDKUser[]
  signIn: () => Promise<NDKUser | void>
  signOut: () => Promise<void>
}

export const AccountContext = createContext<Account>({
  user: undefined,
  follows: [],
  signIn: async () => {},
  signOut: async () => {},
})

export const AccountContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { ndk, relaySet, updateRelaySet } = useContext(NostrContext)
  const [user, setUser] = useState<NDKUser>()
  const [follows, setFollows] = useState<NDKUser[]>([])
  const nostrRef = useRef<typeof window.nostr>()
  nostrRef.current = typeof window !== 'undefined' ? window.nostr : undefined
  const hasNip7Extension = useCallback(() => {
    return !!nostrRef.current
  }, [])

  const updateFollowers = useCallback(async (user: NDKUser) => {
    const follows = await user.follows({
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    })
    setFollows(Array.from(follows))
  }, [])

  const signIn = useCallback(async () => {
    if (hasNip7Extension()) {
      ndk.signer = new NDKNip07Signer()
      const signerUser = await ndk.signer?.user()
      console.log('signIn:signerUser', defaultRelays)
      if (signerUser) {
        const user = ndk.getUser({
          hexpubkey: signerUser.hexpubkey,
          relayUrls: defaultRelays,
        })
        console.log('signIn:user', user)
        user
          .fetchProfile({
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
          })
          .then((profile) => {
            console.log('signIn:profile', profile)
            if (profile) {
              user.profile = profile
            }
          })
          .catch((err) => console.log(err))
        console.log('signIn:profile')
        updateFollowers(user)
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
  }, [ndk, hasNip7Extension, updateFollowers, updateRelaySet])

  const signOut = useCallback(async () => {
    ndk.signer = undefined
    localStorage.removeItem('session')
    setUser(undefined)
    updateRelaySet()
  }, [ndk, updateRelaySet])

  const initUser = useCallback(async () => {
    let user: NDKUser | undefined
    const session = JSON.parse(localStorage.getItem('session') || '{}')
    if (session?.pubkey) {
      if (!hasNip7Extension()) return
      signIn()
    } else {
      updateRelaySet(user)
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
      signIn,
      signOut,
    }
  }, [user, follows, signIn, signOut])

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}
