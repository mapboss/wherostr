'use client'
import MainPane from '@/components/MainPane'
import Map from '@/components/Map'
import { MapContextProvider } from '@/contexts/MapContext'
import { Box } from '@mui/material'

export default function Page() {
  return (
    <MapContextProvider>
      <Box className="flex-1 flex flex-col">
        <Map className="invisible md:visible" />
        <MainPane />
      </Box>
    </MapContextProvider>
  )
}
