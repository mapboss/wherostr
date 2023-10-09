'use client'
import { MapView } from '@/components/MapView'
import { MapContextProvider } from '@/contexts/MapContext'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export default function Page() {
  const query = useSearchParams()
  const ll = query.get('q')
  const [lat, lon] = useMemo(
    () => (ll ? ll.split(',').map((d) => Number(d.trim())) : []),
    [ll],
  )
  return (
    <MapContextProvider>
      <MapView className="flex-1" />
    </MapContextProvider>
  )
}
