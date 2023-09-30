import { NostrContext } from '@/contexts/NostrContext'
import {
  NDKEvent,
  NDKKind,
  NDKSubscriptionCacheUsage,
  NDKUser,
  zapInvoiceFromEvent,
} from '@nostr-dev-kit/ndk'
import { useCallback, useContext, useEffect, useState } from 'react'
import usePromise from 'react-use-promise'

export const useUserStore = (events?: NDKEvent[]) => {
  const { ndk } = useContext(NostrContext)
  const [userIndexes, setUserIndexes] = useState<Record<string, NDKUser>>({})
  const [userStore, setUserStore] = useState<Record<string, NDKUser>>({})

  const initUserStore = useCallback(() => {
    if (!events) return
    setUserIndexes((prev) => {
      return events.reduce((a, b) => {
        let pubkey = b.pubkey
        if (b.kind === NDKKind.Zap) {
          const zapInvoice = zapInvoiceFromEvent(b)
          pubkey = zapInvoice!.zappee
        }
        return {
          ...a,
          [pubkey]: prev[pubkey] || ndk.getUser({ hexpubkey: pubkey }),
        }
      }, {})
    })
  }, [ndk, events])

  useEffect(() => {
    initUserStore()
  }, [initUserStore])

  const [users, error, state] = usePromise(async () => {
    const keys = Object.keys(userIndexes)
    const values = Object.values(userIndexes)
    if (keys.length === 0) return {}
    const result = await Promise.all(
      keys.map(async (key, i) => {
        const user = values[i] || ndk.getUser({ hexpubkey: key })
        if (!user.profile) {
          await user.fetchProfile({
            closeOnEose: true,
            cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
          })
        }
        return { [key]: user }
      }),
    )
    return result.reduce((a, b) => ({ ...a, ...b }), {})
  }, [ndk, userIndexes])

  useEffect(() => {
    if (!users) return
    setUserStore(users)
  }, [users])

  return userStore
}
