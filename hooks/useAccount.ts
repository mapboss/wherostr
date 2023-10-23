'use client'
import { AccountContext, AccountProps } from '@/contexts/AccountContext'
import { NDKUser } from '@nostr-dev-kit/ndk'
import { useContext, useMemo } from 'react'

export const useUser = () => {
  const { user } = useContext(AccountContext)
  return useMemo(() => user, [user])
}
export const useAccount = () => {
  const { user, signing, signIn, signOut } = useContext(AccountContext)
  return useMemo(() => {
    return { user, signing, signIn, signOut }
  }, [user, signing, signIn, signOut])
}

export const useFollowing = () => {
  const { follows, follow, unfollow } = useContext(AccountContext)
  return useMemo<[NDKUser[], AccountProps['follow'], AccountProps['unfollow']]>(
    () => [follows, follow, unfollow],
    [follows, follow, unfollow],
  )
}
