'use client'
import { AccountContext } from '@/contexts/AccountContext'
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
  const { follows } = useContext(AccountContext)
  return useMemo(() => follows, [follows])
}
