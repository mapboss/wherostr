'use client'
import { MapView } from '@/components/MapView'
import { MapContext, MapContextProvider } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import { LngLat, LngLatBounds } from 'maplibre-gl'
import { useSearchParams } from 'next/navigation'
import { useContext, useEffect, useMemo } from 'react'

export default function Page() {
  const query = useSearchParams()
  const q = query.get('q')

  const ll = useMemo(() => {
    if (!q) return
    const ll = Geohash.decode(q)
    return new LngLat(ll.lon, ll.lat)
  }, [q])

  return (
    <MapContextProvider>
      <MapView className="flex-1" />
      <MapController center={ll} />
    </MapContextProvider>
  )
}

const MapController = ({ center }: { center?: LngLat }) => {
  const { map } = useContext(MapContext)

  useEffect(() => {
    console.log({ map, center })
    if (!map || !center) return
    setTimeout(() => {
      map.fitBounds(LngLatBounds.fromLngLat(center), {
        maxZoom: 16,
      })
    }, 100)
  }, [map, center])
  return null
}
