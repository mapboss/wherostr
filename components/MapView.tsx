'use client'
import 'maplibre-gl/dist/maplibre-gl.css'
import React, { PropsWithChildren, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import classNames from 'classnames'
import { Box, Paper } from '@mui/material'
import { useMapLibre } from '@/hooks/useMaplibre'

const opts: Omit<maplibregl.MapOptions, 'container'> = {
  style: {
    version: 8,
    name: 'Open Streets Map',
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution:
          "<a href='https://www.openstreetmap.org/'>&copy; OpenStreetMap Contributors</a>",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'basemap',
        type: 'raster',
        source: 'osm',
        layout: {
          visibility: 'visible',
        },
      },
    ],
  },
  // bounds: [97.3758964376, 5.69138418215, 105.589038527, 20.4178496363],
}

export interface MapProps extends PropsWithChildren {
  className?: string
  onLoad?: (map: maplibregl.Map) => void
}

const MapLoad: React.FC<MapProps> = ({ children, className, onLoad }) => {
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

export const MapView = dynamic(
  () => new Promise<React.FC<MapProps>>((resolve) => resolve(MapLoad)),
  {
    loading: () => <Paper className="fixed inset-0" />,
    ssr: false,
  },
)
