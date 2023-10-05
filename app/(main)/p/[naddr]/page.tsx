'use client'
import { NostrContext } from '@/contexts/NostrContext'
import { Box, Typography } from '@mui/material'
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk'
import { RedirectType } from 'next/dist/client/components/redirect'
import { redirect, useParams } from 'next/navigation'
import { nip19 } from 'nostr-tools'
import { useContext, useMemo } from 'react'
import usePromise from 'react-use-promise'

export default function Page() {
  const { ndk } = useContext(NostrContext)
  const { naddr } = useParams()

  const naddrDesc = useMemo(() => {
    try {
      return nip19.decode(naddr as string)
    } catch (err) {}
  }, [naddr])

  const [user, error, state] = usePromise(async () => {
    if (!naddrDesc || !ndk) return
    if (naddrDesc.type !== 'npub' && naddrDesc.type !== 'nprofile') return
    const pubkey: string =
      typeof naddrDesc.data === 'string'
        ? naddrDesc.data
        : naddrDesc.data.pubkey
    const user = ndk.getUser({ hexpubkey: pubkey })
    await user.fetchProfile({
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      closeOnEose: true,
    })
    return user
  }, [ndk, naddrDesc, naddr])

  if (naddrDesc?.type !== 'npub' && naddrDesc?.type !== 'nprofile') {
    redirect(`/${naddr}`, RedirectType.replace)
  }

  return (
    <Box m={4}>
      <Typography component="pre" variant="caption">
        {JSON.stringify(event || {}, null, 4)}
      </Typography>
    </Box>
  )
}
