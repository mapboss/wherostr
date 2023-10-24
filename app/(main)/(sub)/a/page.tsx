'use client'
import { NostrAddressComponent } from '@/components/NostrAddressComponent'
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

  return <NostrAddressComponent data={naddrDesc.data} />
}
