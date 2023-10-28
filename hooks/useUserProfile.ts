'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNDK, useRelaySet } from './useNostr'
import {
  NDKSubscriptionCacheUsage,
  NDKUser,
  NDKUserProfile,
} from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'

const verifyCache: Record<string, boolean> = {}
export const useUserProfile = (hexpubkey?: string) => {
  const ndk = useNDK()
  const relaySet = useRelaySet()
  const relayUrls = useMemo(
    () => Array.from(relaySet?.relays.values() || []).map((d) => d.url),
    [relaySet],
  )

  const pubkey = useMemo(() => {
    if (!hexpubkey) return
    try {
      if (hexpubkey.startsWith('npub')) {
        const hex = nip19.decode(hexpubkey)
        return hex.type === 'npub' ? hex.data : undefined
      }
      return hexpubkey
    } catch (err) {}
  }, [hexpubkey])

  const [user, setUser] = useState<NDKUser | undefined>(
    pubkey ? ndk.getUser({ hexpubkey: pubkey, relayUrls }) : undefined,
  )

  const fetchProfile = useCallback(async (user: NDKUser) => {
    try {
      const profile = await Promise.race<NDKUserProfile | null>([
        user.fetchProfile({
          cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        }),
        new Promise<null>((_, reject) => {
          setTimeout(() => reject('Timeout'), 5000)
        }),
      ])
      return profile
    } catch (err) {
      return new Promise<NDKUserProfile | null>((resolve) => {
        setTimeout(() => {
          fetchProfile(user).then((d) => resolve(d))
        }, 3000)
      })
    }
  }, [])

  useEffect(() => {
    if (!pubkey) return
    const user = ndk.getUser({ hexpubkey: pubkey, relayUrls })
    setUser(user)
    fetchProfile(user).then(async (profile) => {
      if (!profile) return

      setUser((prev) => {
        const d = {
          ...user,
          npub: user.npub,
          hexpubkey: user.hexpubkey,
          profile: profile,
        } as NDKUser
        return d
      })
      if (!profile.nip05) return profile
      if (!verifyCache[profile.nip05]) {
        const validNip05 = await user
          .validateNip05(profile.nip05)
          .catch((err) => false)
        verifyCache[profile.nip05] = validNip05 === true
      }
      setUser((prev) => {
        const d = {
          ...user,
          npub: user.npub,
          hexpubkey: user.hexpubkey,
          profile: {
            ...profile,
            validNip05: verifyCache[profile.nip05!] === true ? '1' : '0',
          } as NDKUserProfile,
        } as NDKUser
        return d
      })
      return user.profile
    })
  }, [pubkey, ndk, relayUrls, fetchProfile])

  return user
}
