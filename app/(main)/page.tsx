'use client'
import MainPane from '@/components/MainPane'
import { MapView } from '@/components/MapView'
import { MapContextProvider } from '@/contexts/MapContext'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import classNames from 'classnames'
import { RedirectType } from 'next/dist/client/components/redirect'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { nip19 } from 'nostr-tools'
import Geohash from 'latlon-geohash'

export default function Page() {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasMap = searchParams.get('map') === '1'
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  const hash =
    typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
  const naddr = hash.startsWith('/') ? hash.slice(1) : undefined
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
      return router.replace(`/m?q=${ll.lat},${ll.lon}`)
    } catch (err) {
      console.log('err', err)
    }
  } else if (naddrDesc?.type === 'naddr') {
    return redirect(`/a?naddr=${naddr}`, RedirectType.replace)
  } else if (naddrDesc?.type === 'note') {
    return redirect(`/n?naddr=${naddr}`, RedirectType.replace)
  } else if (naddrDesc?.type === 'npub' || naddrDesc?.type === 'nprofile') {
    return redirect(`/u?naddr=${naddr}`, RedirectType.replace)
  } else if (naddrDesc?.type === 'nevent') {
    return redirect(`/e?naddr=${naddr}`, RedirectType.replace)
  }

  return (
    <MapContextProvider>
      <Box
        className={classNames(
          'flex-1 flex flex-col',
          'md:[&_.maplibregl-ctrl-bottom-left]:!left-[640px]',
        )}
      >
        <MapView
          className={classNames('flex-1', {
            // 'invisible -z-10': !mdUp && !hasMap,
            'invisible -z-10': !hasMap,
          })}
        />
        <MainPane />
      </Box>
    </MapContextProvider>
  )
}
