'use client'
import { NostrContext } from '@/contexts/NostrContext'
import { Box, Typography } from '@mui/material'
import { useParams } from 'next/navigation'
import { nip19 } from 'nostr-tools'
import { useContext, useEffect, useMemo } from 'react'

export default function Page() {
  const { ndk } = useContext(NostrContext)
  const { naddr } = useParams()

  const naddrDesc = useMemo(() => {
    try {
      return nip19.decode(naddr as string)
    } catch (err) {}
  }, [naddr])

  useEffect(() => {
    if (!naddrDesc || !ndk) return
    if (naddrDesc.type === 'naddr') {
      const { data } = naddrDesc
      if (data.kind > 3e4) {
        ndk.fetchEvent(naddr as string).then(console.log)
      }
    } else if (naddrDesc.type === 'note') {
      const { data } = naddrDesc
      ndk.fetchEvent(data).then(console.log)
    }
  }, [ndk, naddrDesc, naddr])

  if (!naddrDesc) {
    return <Typography variant="h1">Invalid Nostr address</Typography>
  }

  return <Box m={4}>{naddr}</Box>
}
