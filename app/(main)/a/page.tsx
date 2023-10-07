'use client'
import LiveActivity from '@/components/LiveActivity'
import { useSubscribe } from '@/hooks/useSubscribe'
import { Box, LinearProgress, Typography } from '@mui/material'
import { NDKFilter } from '@nostr-dev-kit/ndk'
import { RedirectType } from 'next/dist/client/components/redirect'
import { redirect, useParams, useSearchParams } from 'next/navigation'
import { nip19 } from 'nostr-tools'
import { useMemo } from 'react'

export default function Page() {
  const searchParams = useSearchParams()
  const params = useParams()
  const naddr = searchParams.get('naddr') || params['naddr']

  const naddrDesc = useMemo(() => {
    try {
      return nip19.decode(naddr as string)
    } catch (err) {}
  }, [naddr])

  if (naddrDesc?.type !== 'naddr') {
    redirect(`/${naddr}`, RedirectType.replace)
  }

  const filter = useMemo<NDKFilter | undefined>(() => {
    if (!naddrDesc) return
    return {
      kinds: [naddrDesc.data.kind],
      authors: [naddrDesc.data.pubkey],
      '#d': [naddrDesc.data.identifier],
    }
  }, [naddrDesc])

  const [events] = useSubscribe(filter, true)

  const event = useMemo(() => events?.[0], [events])

  if (!event) {
    return <LinearProgress />
  }

  if (event?.kind === 30311) {
    return (
      <Box className="px-0 md:px-4" flex={1} display="flex" overflow="hidden">
        <LiveActivity naddr={naddr.toString()} event={event} />
      </Box>
    )
  }

  return (
    <Box m={2} overflow="hidden">
      <Typography component="pre" variant="caption">
        {JSON.stringify(event || {}, null, 4)}
      </Typography>
    </Box>
  )
}
