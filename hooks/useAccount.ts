'use client'
import { AccountContext } from '@/contexts/AccountContext'
import { useContext, useMemo } from 'react'

export const useUser = () => {
  const { user } = useContext(AccountContext)
  return useMemo(() => user, [user])
}
export const useAccount = () => {
  const { user, signIn, signOut } = useContext(AccountContext)
  return useMemo(() => {
    return { user, signIn, signOut }
  }, [user, signIn, signOut])
}

export const useFollowing = () => {
  const { follows } = useContext(AccountContext)
  return useMemo(() => follows, [follows])
}
