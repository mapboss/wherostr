'use client'
import { useNDK, useRelaySet } from './useNostr'
import {
  NDKFilter,
  NDKKind,
  NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk'
import usePromise from 'react-use-promise'

export const useEvent = (idOrFilter: string | NDKFilter<NDKKind>) => {
  const ndk = useNDK()
  const relaySet = useRelaySet()

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
