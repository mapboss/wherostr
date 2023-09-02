'use client'
import MainPane from '@/components/MainPane'
import Map from '@/components/Map'
import { MapContextProvider } from '@/contexts/MapContext'

export default function Page() {
  return (
    <MapContextProvider>
      <div className="flex-1 flex flex-col">
        <Map />
        <MainPane />
      </div>
    </MapContextProvider>
  )
}
