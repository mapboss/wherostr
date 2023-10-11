'use client'
import { useEffect, useMemo, useState } from 'react'
import { useNDK, useRelaySet } from './useNostr'
import { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'

const verifyCache: Record<string, boolean> = {}
export const useUserProfile = (hexpubkey?: string) => {
  const ndk = useNDK()
  const relaySet = useRelaySet()
  const relayUrls = useMemo(
    () => Array.from(relaySet?.relays.values() || []).map((d) => d.url),
    [relaySet],
  )
  const [user, setUser] = useState<NDKUser | undefined>(
    hexpubkey ? ndk.getUser({ hexpubkey, relayUrls }) : undefined,
  )

  useEffect(() => {
    if (!hexpubkey) return
    let user: NDKUser
    if (hexpubkey.startsWith('npub')) {
      try {
        const hex = nip19.decode(hexpubkey)
        if (hex.type !== 'npub') return
        user = ndk.getUser({ hexpubkey: hex.data, relayUrls })
      } catch (err) {
        return
      }
    } else {
      user = ndk.getUser({ hexpubkey, relayUrls })
    }
    setUser(user)
    user.fetchProfile().then(async (profile) => {
      if (!profile) return
      setUser((prev) => {
        const d = {
          ...user,
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
  }, [hexpubkey, ndk, relayUrls])

  return user
}
