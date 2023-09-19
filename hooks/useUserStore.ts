import { NostrContext } from '@/contexts/NostrContext'
import {
  NDKEvent,
  NDKKind,
  NDKSubscriptionCacheUsage,
  NDKUser,
  NDKUserProfile,
  zapInvoiceFromEvent,
} from '@nostr-dev-kit/ndk'
import { useCallback, useContext, useEffect, useState } from 'react'
import usePromise from 'react-use-promise'

export const useUserStore = (events?: NDKEvent[]) => {
  const { ndk } = useContext(NostrContext)
  const [userIndexes, setUserIndexes] = useState<Record<string, NDKUser>>({})
  const [userStore, setUserStore] = useState<Record<string, NDKUserProfile>>({})

  const initUserStore = useCallback(() => {
    if (!events) return
    setUserIndexes((prev) => {
      return events.reduce((a, b) => {
        let pubkey = b.pubkey
        if (b.kind === NDKKind.Zap) {
          const zapInvoice = zapInvoiceFromEvent(b)
          pubkey = zapInvoice!.zappee
        } else if (b.kind === 30311) {
          pubkey = b.tagValue('p') || b.pubkey
        }
        if (prev[pubkey]) {
          return { ...a, [pubkey]: prev[pubkey] }
        }
        const user = ndk.getUser({ hexpubkey: pubkey })
        return { ...a, [pubkey]: user }
      }, {})
    })
  }, [events, ndk])

  useEffect(() => {
    initUserStore()
  }, [initUserStore])

  const [users, error, state] = usePromise(async () => {
    const keys = Object.keys(userIndexes)
    const values = Object.values(userIndexes)
    if (keys.length === 0) return {}
    const result = await Promise.all(
      keys
        .map(async (key, i) => {
          // console.log(key, values[i])
          // if (values[i]) {
          //   return { [key]: values[i] }
          // }
          if (!values[i]) return
          const user = values[i]
          if (!user.profile) {
            await user.fetchProfile({
              closeOnEose: true,
              cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
            })
          }

          const displayName =
            user.profile?.displayName ||
            user.profile?.name ||
            user?.npub.substring(0, 12)

          return { [key]: { ...user.profile, displayName } as NDKUserProfile }
        })
        .filter((d) => !!d),
    )
    return result.reduce((a, b) => ({ ...a, ...b }), {})
  }, [ndk, userIndexes])

  useEffect(() => {
    if (!users) return
    setUserStore(users)
  }, [users])

  return userStore
}
