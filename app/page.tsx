'use client'
import MainPane from '@/components/MainPane'
import Map from '@/components/Map'

export default function Page() {
  return (
    <div className="flex-1 flex flex-col">
      <Map />
      <MainPane />
    </div>
  )
}
