'use client'
import { ShortTextNotePane } from '@/components/EventActionModal'
import { NostrContext } from '@/contexts/NostrContext'
import { Box, Paper } from '@mui/material'
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk'
import { RedirectType } from 'next/dist/client/components/redirect'
import { redirect, useParams, useSearchParams } from 'next/navigation'
import { nip19 } from 'nostr-tools'
import { useContext, useMemo } from 'react'
import usePromise from 'react-use-promise'

export default function Page() {
  const { ndk } = useContext(NostrContext)
  const searchParams = useSearchParams()
  const params = useParams()
  const naddr = searchParams.get('naddr') || params['naddr']

  const naddrDesc = useMemo(() => {
    try {
      return nip19.decode(naddr as string)
    } catch (err) {}
  }, [naddr])

  const [event, error, state] = usePromise(async () => {
    if (!naddr || !naddrDesc || !ndk) return
    if (naddrDesc.type !== 'note') return
    const ev = await ndk.fetchEvent(naddr.toString(), {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    })
    return ev
  }, [ndk, naddrDesc, naddr])

  if (naddrDesc?.type !== 'note') {
    redirect(`/${naddr}`, RedirectType.replace)
  }

  if (!event) return

  return (
    <Box m={4}>
      <Paper className="relative w-full !rounded-2xl max-w-2xl mx-auto overflow-hidden">
        <ShortTextNotePane event={event} comments />
      </Paper>
    </Box>
  )
}
