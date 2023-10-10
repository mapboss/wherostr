'use client'
import { useEffect, useMemo, useState } from 'react'
import { useNDK, useRelaySet } from './useNostr'
import { NDKUser } from '@nostr-dev-kit/ndk'

export const useUserProfile = (hexpubkey: string) => {
  const ndk = useNDK()
  const relaySet = useRelaySet()
  const [user, setUser] = useState<NDKUser>(ndk.getUser({ hexpubkey }))

  const relayUrls = useMemo(
    () => Array.from(relaySet?.relays.values() || []).map((d) => d.url),
    [relaySet],
  )

  useEffect(() => {
    if (!hexpubkey) return
    const user = ndk.getUser({ hexpubkey, relayUrls })
    user.fetchProfile().then((profile) => {
      if (!profile) return
      user.profile = profile
      setUser(user)
    })
  }, [hexpubkey, ndk, relayUrls])

  return user
}
