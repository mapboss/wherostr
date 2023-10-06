'use client'
import MainPane from '@/components/MainPane'
import Map from '@/components/Map'
import { MapContextProvider } from '@/contexts/MapContext'
import { Box, Collapse, useMediaQuery, useTheme } from '@mui/material'
import { useSearchParams } from 'next/navigation'

export default function Page() {
  const theme = useTheme()
  const searchParams = useSearchParams()
  const hasMap = searchParams.get('map') === '1'
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <MapContextProvider>
      <Box className="flex-1 flex flex-col">
        <Collapse in={mdUp || hasMap} className="overflow-hidden">
          <Map />
        </Collapse>
        <MainPane />
      </Box>
    </MapContextProvider>
  )
}
