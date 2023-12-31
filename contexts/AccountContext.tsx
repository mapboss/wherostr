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
import { useAction } from '@/hooks/useApp'
import { nip19 } from 'nostr-tools'
import usePromise from 'react-use-promise'

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
  setMuteList: Dispatch<SetStateAction<string[]>>
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
  setMuteList: () => {},
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
  const [muteList, setMuteList] = useState<string[]>([])
  const nostrRef = useRef<typeof window.nostr>(
    typeof window !== 'undefined' ? window.nostr : undefined,
  )
  nostrRef.current = typeof window !== 'undefined' ? window.nostr : undefined
  const hasNip7Extension = useCallback(() => {
    return !!nostrRef.current
  }, [nostrRef])

  const updateFollows = useCallback(
    async (user: NDKUser) => {
      const follows: Set<NDKUser> = new Set()
      const contactListEvent = await ndk.fetchEvent(
        {
          kinds: [3],
          authors: [user.hexpubkey],
        },
        undefined,
        relaySet,
      )
      if (contactListEvent) {
        const pubkeys = new Set<string>()
        contactListEvent.tags.forEach((tag) => {
          if (tag[0] === 'p') {
            try {
              pubkeys.add(tag[1])
            } catch (e) {}
          }
        })
        pubkeys.forEach((pubkey) => {
          const user = new NDKUser({ hexpubkey: pubkey })
          user.ndk = ndk
          follows.add(user)
        })
      }
      setFollows(Array.from(follows))
    },
    [ndk, relaySet],
  )

  const follow = useCallback(
    async (newFollow: NDKUser) => {
      if (!user) return
      const followsSet = new Set(follows)
      const followUser = ndk.getUser({ hexpubkey: newFollow.hexpubkey })
      if (followsSet.has(followUser)) {
        return
      }
      followsSet.add(followUser)
      const event = new NDKEvent(ndk)
      event.kind = 3
      followsSet.forEach((follow) => {
        event.tag(follow)
      })
      await event.publish(relaySet)
      setFollows(Array.from(followsSet))
    },
    [user, follows, ndk, relaySet],
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
      await event.publish(relaySet)
      setFollows(Array.from(followsSet))
    },
    [follows, ndk, relaySet],
  )

  const signIn = useCallback(
    async (type: SignInType, key?: string) => {
      try {
        let user: NDKUser | undefined
        setSigning(true)
        let pubkey: string | undefined
        let readOnly = true
        if (type === 'nip7') {
          if (!hasNip7Extension()) {
            return showSnackbar('Extension not found')
          }
          readOnly = false
          ndk.signer = new NDKNip07Signer()
          const signerUser = await ndk.signer?.user()
          console.log('signIn:signerUser')
          if (signerUser) {
            pubkey = signerUser.hexpubkey
            // user = await getUser(signerUser.hexpubkey)
            // setReadOnly(false)
          }
        } else if (type === 'nsec') {
          readOnly = false
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
            pubkey = signerUser.hexpubkey
            // user = await getUser(signerUser.hexpubkey)
            // setReadOnly(false)
            readOnly = false
          }
        } else if (type === 'npub' && key) {
          readOnly = true
          pubkey = key
          ndk.signer = undefined
          user = await getUser(key)
        }
        if (pubkey) {
          user = await getUser(pubkey)
        }
        if (user) {
          localStorage.setItem(
            'session',
            JSON.stringify({
              pubkey: user.hexpubkey,
              type,
              ...(type === 'nsec' ? { nsec: key } : undefined),
            }),
          )
          console.log('signIn:savedSession')
          await updateRelaySet(user)
          console.log('signIn:updateRelaySet')
          await updateFollows(user)
          console.log('signIn:fetchFollows')
          setUser(user)
          console.log('signIn:setUser')
          setReadOnly(readOnly)
          console.log('signIn:setReadOnly')
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
    setReadOnly(true)
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
      kinds: [NDKKind.MuteList, NDKKind.ChannelMuteUser],
      authors: [user?.hexpubkey],
    }
  }, [user?.hexpubkey])

  usePromise(async () => {
    if (!filter || !relaySet) return setMuteList([])

    const event = await ndk.fetchEvent(
      filter,
      { cacheUsage: NDKSubscriptionCacheUsage.PARALLEL },
      relaySet,
    )
    const list =
      event?.getMatchingTags('p').map(([tag, pubkey]) => {
        return pubkey
      }) || []
    setMuteList(list)
  }, [filter, relaySet])

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
      setMuteList,
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
