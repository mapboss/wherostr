'use client'
import MainPane from '@/components/MainPane'
import Map from '@/components/Map'
import { MapContextProvider } from '@/contexts/MapContext'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import classNames from 'classnames'
import { RedirectType } from 'next/dist/client/components/redirect'
import { redirect, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { nip19 } from 'nostr-tools'

export default function Page() {
  const theme = useTheme()
  const searchParams = useSearchParams()
  const hasMap = searchParams.get('map') === '1'
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  const hash =
    typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
  const naddr = hash.startsWith('/n') ? hash.slice(1) : undefined
  const naddrDesc = useMemo(() => {
    try {
      return nip19.decode(naddr as string)
    } catch (err) {}
  }, [naddr])

  if (naddrDesc?.type === 'naddr') {
    redirect(`/a?naddr=${naddr}`, RedirectType.replace)
  } else if (naddrDesc?.type === 'note') {
    redirect(`/n?naddr=${naddr}`, RedirectType.replace)
  } else if (naddrDesc?.type === 'npub' || naddrDesc?.type === 'nprofile') {
    redirect(`/u?naddr=${naddr}`, RedirectType.replace)
  } else if (naddrDesc?.type === 'nevent') {
    redirect(`/e?naddr=${naddr}`, RedirectType.replace)
  }

  return (
    <MapContextProvider>
      <Box className="flex-1 flex flex-col">
        <Map
          className={classNames('flex-1', {
            'invisible -z-10': !mdUp && !hasMap,
            'md:visible': true,
          })}
        />
        <MainPane />
      </Box>
    </MapContextProvider>
  )
}
