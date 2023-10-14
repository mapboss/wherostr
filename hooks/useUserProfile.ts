'use client'
import { useContext } from 'react'
import { NostrContext } from '@/contexts/NostrContext'
import usePromise from 'react-use-promise'

export const useUserProfile = (hexpubkey?: string) => {
  const { getUser, relaySet } = useContext(NostrContext)
  const [user] = usePromise(getUser(hexpubkey), [hexpubkey, getUser, relaySet])
  return user
}
