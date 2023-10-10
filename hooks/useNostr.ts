'use client'
import { NostrContext } from '@/contexts/NostrContext'
import { useContext, useMemo } from 'react'

export const useNDK = () => {
  const { ndk } = useContext(NostrContext)
  return useMemo(() => ndk, [ndk])
}

export const useRelaySet = () => {
  const { relaySet } = useContext(NostrContext)
  return useMemo(() => relaySet, [relaySet])
}
