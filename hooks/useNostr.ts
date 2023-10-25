'use client'
import { streamRelayUrls } from '@/constants/app'
import { NostrContext } from '@/contexts/NostrContext'
import { NDKRelaySet } from '@nostr-dev-kit/ndk'
import { useContext, useMemo } from 'react'

export const useNDK = () => {
  const { ndk } = useContext(NostrContext)
  return useMemo(() => ndk, [ndk])
}

export const useRelaySet = () => {
  const { relaySet } = useContext(NostrContext)
  return useMemo(() => relaySet, [relaySet])
}

// const relays = new Set<NDKRelay>()
// streamRelayUrls.forEach((d) => {
//   relays.add(new NDKRelay(d))
// })

export const useStreamRelaySet = () => {
  const { ndk } = useContext(NostrContext)
  return useMemo(() => NDKRelaySet.fromRelayUrls(streamRelayUrls, ndk), [ndk])
}
