'use client'
import { AccountContext, AccountProps } from '@/contexts/AccountContext'
import { NDKEvent, NDKKind, NDKUser } from '@nostr-dev-kit/ndk'
import { useCallback, useContext, useMemo } from 'react'
import { useNDK } from './useNostr'

export const useUser = () => {
  const { user } = useContext(AccountContext)
  return useMemo(() => user, [user])
}
export const useAccount = () => {
  const { user, signing, readOnly, signIn, signOut } =
    useContext(AccountContext)
  return useMemo(() => {
    return { user, signing, readOnly, signIn, signOut }
  }, [user, signing, readOnly, signIn, signOut])
}

export const useFollowing = () => {
  const { follows, follow, unfollow } = useContext(AccountContext)
  return useMemo<[NDKUser[], AccountProps['follow'], AccountProps['unfollow']]>(
    () => [follows, follow, unfollow],
    [follows, follow, unfollow],
  )
}

export const useMuting = () => {
  const ndk = useNDK()
  const { muteList } = useContext(AccountContext)
  const mute = useCallback(
    async (muteUser: NDKUser) => {
      const event = new NDKEvent(ndk)
      event.kind = NDKKind.MuteList
      muteList.forEach((d) => {
        event.tag(ndk.getUser({ hexpubkey: d }))
      })
      event.tag(muteUser)
      console.log('mute', event.rawEvent())
      // await event.publish()
    },
    [ndk, muteList],
  )

  return useMemo<[AccountProps['muteList'], typeof mute]>(() => {
    return [muteList || [], mute]
  }, [muteList, mute])
}
