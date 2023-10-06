'use client'
import MainPane from '@/components/MainPane'
import Map from '@/components/Map'
import { MapContextProvider } from '@/contexts/MapContext'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import classNames from 'classnames'
import { RedirectType } from 'next/dist/client/components/redirect'
import { redirect, useSearchParams } from 'next/navigation'

export default function Page() {
  const theme = useTheme()
  const searchParams = useSearchParams()
  const hasMap = searchParams.get('map') === '1'
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  if (typeof window == 'undefined') return <div />
  const hash = window.location.hash.slice(1)

  if (hash.startsWith('/n')) {
    const naddr = hash.slice(1)
    redirect(`/p?naddr=${naddr}`, RedirectType.replace)
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
