'use client'
import { NostrPubkeyComponent } from '@/components/NostrPubkeyComponent'
import { Box, Paper } from '@mui/material'
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

  if (naddrDesc?.type !== 'npub' && naddrDesc?.type !== 'nprofile') {
    redirect(`/${naddr}`, RedirectType.replace)
  }

  return (
    <Box mx={4}>
      <Paper className="relative w-full !rounded-2xl max-w-2xl mx-auto overflow-hidden">
        <NostrPubkeyComponent
          data={
            typeof naddrDesc.data === 'string'
              ? naddrDesc.data
              : naddrDesc.data.pubkey
          }
        />
      </Paper>
    </Box>
  )
}
