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
  NDKPrivateKeySigner,
  NDKSubscriptionCacheUsage,
  NDKUser,
} from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import { useSubscribe } from '@/hooks/useSubscribe'
import { useAction } from '@/hooks/useApp'
import { nip19 } from 'nostr-tools'

export type SignInType = 'nip7' | 'nsec' | 'npub'
export interface AccountProps {
  user?: NDKUser
  readOnly: boolean
  signing: boolean
  muteList: string[]
  follows: NDKUser[]
  signIn: (type: SignInType, key?: string) => Promise<NDKUser | void>
  signOut: () => Promise<void>
  setFollows: Dispatch<SetStateAction<NDKUser[]>>
  follow: (newFollow: NDKUser) => Promise<void>
  unfollow: (unfollowUser: NDKUser) => Promise<void>
}

export const AccountContext = createContext<AccountProps>({
  user: undefined,
  readOnly: true,
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
  const { showSnackbar } = useAction()
  const [readOnly, setReadOnly] = useState(true)
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

  const signIn = useCallback(
    async (type: SignInType, key?: string) => {
      try {
        let user: NDKUser | undefined
        setSigning(true)
        if (type === 'nip7') {
          if (!hasNip7Extension()) {
            return showSnackbar('Extension not found')
          }
          ndk.signer = new NDKNip07Signer()
          const signerUser = await ndk.signer?.user()
          console.log('signIn:signerUser')
          if (signerUser) {
            user = await getUser(signerUser.hexpubkey)
            setReadOnly(false)
          }
        } else if (type === 'nsec') {
          let secret = key
          if (key?.startsWith('nsec')) {
            const nsecProfile = nip19.decode(key)
            if (nsecProfile.type !== 'nsec') throw new Error('Invalid nsec')
            secret = nsecProfile.data
          }
          console.log('secret', secret)
          ndk.signer = new NDKPrivateKeySigner(secret)
          console.log('ndk.signer', ndk.signer)
          const signerUser = await ndk.signer?.user()
          console.log('signerUser', signerUser)
          if (signerUser) {
            user = await getUser(signerUser.hexpubkey)
            setReadOnly(false)
          }
        } else if (type === 'npub') {
          ndk.signer = undefined
          user = await getUser(key)
          setReadOnly(true)
        }
        if (user) {
          await updateFollows(user)
          console.log('signIn:fetchFollows')
          localStorage.setItem(
            'session',
            JSON.stringify({
              pubkey: user.hexpubkey,
              type,
              ...(type === 'nsec' ? { nsec: key } : undefined),
            }),
          )
          await updateRelaySet(user)
          console.log('signIn:updateRelaySet')
          setUser(user)
          return user
        }
      } catch (err: any) {
        console.log('err', err)
        showSnackbar(err.message, {
          slotProps: { alert: { severity: 'error' } },
        })
      } finally {
        setSigning(false)
      }
    },
    [
      ndk,
      hasNip7Extension,
      getUser,
      updateFollows,
      updateRelaySet,
      showSnackbar,
    ],
  )

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
        await signIn(
          session.type,
          session.type === 'nsec' ? session?.nsec : session?.pubkey,
        )
        return
      }
      await updateRelaySet()
    } catch (err) {
    } finally {
      setSigning(false)
    }
  }, [updateRelaySet, signIn])

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
      readOnly,
      muteList,
      follows,
      signing,
      signIn,
      signOut,
      setFollows,
      follow,
      unfollow,
    }
  }, [
    user,
    readOnly,
    muteList,
    follows,
    signing,
    signIn,
    signOut,
    follow,
    unfollow,
  ])

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}
