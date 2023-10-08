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
import { NostrContext } from '@/contexts/NostrContext'

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
  const { ndk, getUser, connectRelays } = useContext(NostrContext)
  const [user, setUser] = useState<NDKUser>()
  const [follows, setFollows] = useState<NDKUser[]>([])
  const nostrRef = useRef<typeof window.nostr>()
  nostrRef.current = typeof window !== 'undefined' ? window.nostr : undefined

  const hasNip7Extension = useCallback(() => {
    return !!nostrRef.current
  }, [])
  // useEffect(() => {
  //   if (ndk && nostrRef.current) {
  //     ndk.signer = new NDKPrivateKeySigner()
  //     ndk.signer = new NDKNip07Signer()
  //   }
  // }, [ndk])

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

  const fetchFollows = useCallback(async (user: NDKUser) => {
    const follows = await user.follows({
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    })
    setFollows(Array.from(follows))
  }, [])

  const signIn = useCallback(async () => {
    if (hasNip7Extension()) {
      ndk.signer = new NDKNip07Signer()
      const signerUser = await ndk.signer?.user()
      if (signerUser) {
        const user = ndk.getUser({ hexpubkey: signerUser.hexpubkey })
        const profile = await user.fetchProfile()
        if (profile) {
          user.profile = profile
        }
        await fetchFollows(user)
        localStorage.setItem(
          'session',
          JSON.stringify({ pubkey: user.hexpubkey, type: 'nip7' }),
        )

        setUser(user)
        await connect(user)
        return user
      }
    }
  }, [ndk, hasNip7Extension, connect, fetchFollows])

  const signOut = useCallback(async () => {
    if (hasNip7Extension()) {
      ndk.signer = new NDKNip07Signer()
      localStorage.removeItem('session')
      setUser(undefined)
      await connectRelays()
    }
  }, [ndk, hasNip7Extension, connectRelays])

  useEffect(() => {
    const func = async () => {
      let user: NDKUser | undefined
      const session = JSON.parse(localStorage.getItem('session') || '{}')
      if (session?.pubkey) {
        await connect()
        if (!hasNip7Extension()) return
        ndk.signer = new NDKNip07Signer()
        const signerUser = await ndk.signer.user()
        if (signerUser?.hexpubkey) {
          user = await getUser(signerUser?.hexpubkey)
        }
      }
      await connect(user)
      if (user) {
        setUser(user)
        await fetchFollows(user)
      }
    }
    func()
  }, [ndk, hasNip7Extension, connect, getUser, fetchFollows])

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
