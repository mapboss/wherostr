'use client'
import { streamRelayUrls } from '@/constants/app'
import { NostrContext } from '@/contexts/NostrContext'
import { NDKRelay, NDKRelaySet } from '@nostr-dev-kit/ndk'
import { useContext, useMemo } from 'react'

export const useNDK = () => {
  const { ndk } = useContext(NostrContext)
  return useMemo(() => ndk, [ndk])
}

export const useRelaySet = () => {
  const { relaySet } = useContext(NostrContext)
  return useMemo(() => relaySet, [relaySet])
}

export const useStreamRelaySet = () => {
  const { ndk } = useContext(NostrContext)
  return useMemo(() => {
    const relays = streamRelayUrls.map((d) => {
      const relay = new NDKRelay(d)
      relay.connect()
      return relay
    })
    return new NDKRelaySet(new Set(relays), ndk)
  }, [ndk])
}
