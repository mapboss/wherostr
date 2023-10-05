'use client'
import MainPane from '@/components/MainPane'
import Map from '@/components/Map'
import { MapContextProvider } from '@/contexts/MapContext'
import { Box, Hidden } from '@mui/material'
import { useSearchParams } from 'next/navigation'

export default function Page() {
  // const searchParams = useSearchParams()
  // const hasMap = searchParams.get('map') === '1'
  return (
    <MapContextProvider>
      <Box className="flex-1 flex flex-col">
        <Hidden mdDown>
          <Map />
        </Hidden>
        <MainPane />
      </Box>
    </MapContextProvider>
  )
}
