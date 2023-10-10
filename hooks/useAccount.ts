'use client'
import { AccountContext } from '@/contexts/AccountContext'
import { useContext, useMemo } from 'react'

export const useUser = () => {
  const { user } = useContext(AccountContext)
  return useMemo(() => user, [user])
}

export const useFollowing = () => {
  const { follows } = useContext(AccountContext)
  return useMemo(() => follows, [follows])
}
