'use client'
import 'maplibre-gl/dist/maplibre-gl.css'
import React, { PropsWithChildren, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import classNames from 'classnames'
import { Box, Paper } from '@mui/material'
import { useMapLibre } from '@/hooks/useMaplibre'

const opts: Omit<maplibregl.MapOptions, 'container'> = {
  style:
    'https://api.maptiler.com/maps/streets/style.json?key=1rAf8E6L3Yobwc20LE24',
}

export interface MapProps extends PropsWithChildren {
  className?: string
  onLoad?: (map: maplibregl.Map) => void
}

const Map: React.FC<MapProps> = ({ children, className, onLoad }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useMapLibre(mapContainer, opts)

  useEffect(() => {
    if (!map || !onLoad) return
    const handler = (evt: maplibregl.MapLibreEvent) => {
      onLoad?.(evt.target)
    }
    map.on('style.load', handler)
    return () => {
      map.off('style.load', handler)
    }
  }, [map, onLoad])

  return (
    <Box className={classNames('absolute inset-0 flex', className)}>
      <Box ref={mapContainer} className="flex-1">
        {children}
      </Box>
    </Box>
  )
}

export default dynamic(
  () => new Promise<React.FC<MapProps>>((resolve) => resolve(Map)),
  {
    loading: () => <Paper className="fixed inset-0" />,
    ssr: false,
  },
)
