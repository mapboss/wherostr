'use client'
import { NostrContext } from '@/contexts/NostrContext'
import { useContext } from 'react'
import usePromise from 'react-use-promise'

export const useUserCache = (hexpubkey: string) => {
  const { getUser } = useContext(NostrContext)
  return usePromise(getUser(hexpubkey), [hexpubkey])
}

export const useEventCache = (id: string) => {
  const { getEvent } = useContext(NostrContext)
  return usePromise(getEvent(id), [id])
}
