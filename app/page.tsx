'use client'
import MainPane from '@/components/MainPane'
import Map from '@/components/Map'
import { Box } from '@mui/material'

export default function Page() {
  return (
    <Box className="flex-1 flex flex-col">
      <Map />
      <MainPane />
    </Box>
  )
}
