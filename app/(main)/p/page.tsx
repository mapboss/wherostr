'use client'
import { Typography } from '@mui/material'
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

  if (!naddrDesc) {
    return <Typography variant="h2">Invalid Nostr address</Typography>
  }
  if (naddrDesc.type === 'naddr') {
    redirect(`/a?naddr=${naddr}`, RedirectType.replace)
  } else if (naddrDesc.type === 'note') {
    redirect(`/n?naddr=${naddr}`, RedirectType.replace)
  } else if (naddrDesc.type === 'npub' || naddrDesc.type === 'nprofile') {
    redirect(`/u?naddr=${naddr}`, RedirectType.replace)
  } else if (naddrDesc.type === 'nevent') {
    redirect(`/e?naddr=${naddr}`, RedirectType.replace)
  } else {
    return <Typography variant="h2">Invalid Nostr address</Typography>
  }
}
