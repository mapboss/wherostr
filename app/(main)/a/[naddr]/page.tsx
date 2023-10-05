'use client'
import LiveActivity from '@/components/LiveActivity'
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

  const [event, error, state] = usePromise(async () => {
    if (!naddr || !naddrDesc || !ndk) return
    if (naddrDesc.type !== 'naddr') return
    return ndk.fetchEvent(naddr.toString(), {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      closeOnEose: true,
    })
  }, [ndk, naddrDesc, naddr])

  if (naddrDesc?.type !== 'naddr') {
    redirect(`/${naddr}`, RedirectType.replace)
  }

  if (event?.kind === 30311) {
    return (
      <Box px={3} flex={1} display="flex" overflow="hidden">
        <LiveActivity naddr={naddr.toString()} event={event} />
      </Box>
    )
  }

  return (
    <Box m={4}>
      <Typography component="pre" variant="caption">
        {JSON.stringify(event || {}, null, 4)}
      </Typography>
    </Box>
  )
}
