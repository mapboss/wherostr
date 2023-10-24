'use client'
import {
  Dispatch,
  FC,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKNip07Signer,
  NDKSubscriptionCacheUsage,
  NDKUser,
} from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import { useSubscribe } from '@/hooks/useSubscribe'

export interface AccountProps {
  user?: NDKUser
  signing: boolean
  muteList: string[]
  follows: NDKUser[]
  signIn: () => Promise<NDKUser | void>
  signOut: () => Promise<void>
  setFollows: Dispatch<SetStateAction<NDKUser[]>>
  follow: (newFollow: NDKUser) => Promise<void>
  unfollow: (unfollowUser: NDKUser) => Promise<void>
}

export const AccountContext = createContext<AccountProps>({
  user: undefined,
  muteList: [],
  follows: [],
  signing: true,
  signIn: async () => {},
  signOut: async () => {},
  setFollows: () => {},
  follow: async () => {},
  unfollow: async () => {},
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

  const follow = useCallback(
    async (newFollow: NDKUser) => {
      if (!user) return
      const followsSet = new Set(follows)
      const followUser = ndk.getUser({ hexpubkey: newFollow.hexpubkey })
      const isOK = await user.follow(followUser, followsSet)
      if (!isOK) return
      setFollows(Array.from(followsSet))
    },
    [user, follows, ndk],
  )

  const unfollow = useCallback(
    async (unfollowUser: NDKUser) => {
      if (!follows.length) return
      const event = new NDKEvent(ndk)
      event.kind = 3
      const followsSet = new Set(follows)
      const exists = follows.find((d) => d.hexpubkey === unfollowUser.hexpubkey)
      exists && followsSet.delete(exists)
      followsSet.forEach((d) => {
        event.tag(d)
      })
      await event.publish()
      setFollows(Array.from(followsSet))
    },
    [follows, ndk],
  )

  const signIn = useCallback(async () => {
    if (hasNip7Extension()) {
      ndk.signer = new NDKNip07Signer()
      const signerUser = await ndk.signer?.user()
      console.log('signIn:signerUser')
      if (signerUser) {
        const user = await getUser(signerUser.hexpubkey)
        if (user) {
          await updateFollows(user)
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

  const filter = useMemo<NDKFilter | undefined>(() => {
    if (!user?.hexpubkey) return
    return {
      kinds: [NDKKind.MuteList],
      authors: [user?.hexpubkey],
    }
  }, [user?.hexpubkey])
  const [muteListEvent] = useSubscribe(filter)

  const muteList = useMemo(
    () =>
      muteListEvent[0]?.getMatchingTags('p').map(([tag, pubkey]) => {
        return pubkey
      }),
    [muteListEvent],
  )

  const value = useMemo((): AccountProps => {
    return {
      user,
      muteList,
      follows,
      signing,
      signIn,
      signOut,
      setFollows,
      follow,
      unfollow,
    }
  }, [user, muteList, follows, signing, signIn, signOut, follow, unfollow])

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}
