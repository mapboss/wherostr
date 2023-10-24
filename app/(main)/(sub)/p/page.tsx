'use client'
import { Box, Paper, Typography } from '@mui/material'
import { redirect, useParams } from 'next/navigation'
import { FC, PropsWithChildren, useMemo } from 'react'
import { nip19 } from 'nostr-tools'
import Geohash from 'latlon-geohash'
import { NostrAddressComponent } from '@/components/NostrAddressComponent'
import { NostrNoteComponent } from '@/components/NostsNoteComponent'
import { NostrPubkeyComponent } from '@/components/NostrPubkeyComponent'
import { NostrEventComponent } from '@/components/NostrEventComponent'
import { RedirectType } from 'next/dist/client/components/redirect'
import classNames from 'classnames'

export default function Page() {
  const { id } = useParams()
  const naddr = useMemo(() => (typeof id === 'string' ? id : id?.[0]), [id])

  const naddrDesc = useMemo(() => {
    try {
      if (!naddr) return
      return nip19.decode(naddr as string)
    } catch (err) {}
  }, [naddr])

  if (!naddrDesc && naddr) {
    try {
      const ll = Geohash.decode(naddr)
      console.log('Geohash', ll)
      redirect(`/m?q=${ll.lat},${ll.lon}`, RedirectType.replace)
    } catch (err) {
      console.log('err', err)
    }
  }

  const component = useMemo(() => {
    if (naddrDesc?.type === 'naddr') {
      return (
        <Layout2>
          <NostrAddressComponent data={naddrDesc.data} />
        </Layout2>
      )
    } else if (naddrDesc?.type === 'note') {
      return (
        <Layout>
          <NostrNoteComponent data={naddrDesc.data} />
        </Layout>
      )
    } else if (naddrDesc?.type === 'npub') {
      return (
        <Layout>
          <NostrPubkeyComponent data={naddrDesc.data} />
        </Layout>
      )
    } else if (naddrDesc?.type === 'nprofile') {
      return (
        <Layout>
          <NostrPubkeyComponent data={naddrDesc.data.pubkey} />
        </Layout>
      )
    } else if (naddrDesc?.type === 'nevent') {
      return (
        <Layout>
          <NostrEventComponent data={naddrDesc.data} />
        </Layout>
      )
    } else {
      return (
        <Layout>
          <Typography variant="h6">Invalid Nostr Address</Typography>
        </Layout>
      )
    }
  }, [naddrDesc])

  return component
}

const Layout: FC<PropsWithChildren & { className?: string }> = ({
  children,
  className,
}) => {
  return (
    <Box className={classNames('mx-0 md:mx-4', className)}>
      <Paper className="relative flex-auto w-full !rounded-2xl max-w-2xl mx-auto overflow-hidden">
        {children}
      </Paper>
    </Box>
  )
}

const Layout2: FC<PropsWithChildren & { className?: string }> = ({
  children,
  className,
}) => {
  return (
    <Box
      className={classNames(
        'flex flex-1 mx-0 md:mx-4 overflow-hidden',
        className,
      )}
    >
      {children}
    </Box>
  )
}
