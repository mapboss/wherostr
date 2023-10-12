'use client'
import { useNDK, useRelaySet } from './useNostr'
import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKRelaySet,
  NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk'
import { useMemo } from 'react'
import usePromise from 'react-use-promise'

export const useEvent = (
  idOrFilter: string | NDKFilter<NDKKind>,
  optRelaySet?: NDKRelaySet,
) => {
  const ndk = useNDK()
  const defaultRelaySet = useRelaySet()
  const relaySet = useMemo(
    () => optRelaySet || defaultRelaySet,
    [optRelaySet, defaultRelaySet],
  )

  return usePromise(
    () =>
      ndk.fetchEvent(
        idOrFilter,
        { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
        relaySet,
      ),
    [idOrFilter, relaySet],
  )
}

export const useEvents = (
  filter: NDKFilter<NDKKind>,
  optRelaySet?: NDKRelaySet,
) => {
  const ndk = useNDK()
  const defaultRelaySet = useRelaySet()
  const relaySet = useMemo(
    () => optRelaySet || defaultRelaySet,
    [optRelaySet, defaultRelaySet],
  )

  return usePromise(
    async () =>
      (await ndk.fetchEvents(
        filter,
        { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
        relaySet,
      )) || new Set<NDKEvent>(),
    [filter, relaySet],
  )
}
