import { useContext, useEffect, useState } from 'react'
import Filter from './Filter'
import { EventContext } from '@/contexts/EventContext'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'

const MainPane = () => {
  const { fetchEvents, events } = useContext(EventContext)
  const { map } = useContext(MapContext)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!map) return
    const handler = (evt: maplibregl.MapLibreEvent) => {
      setMapLoaded(true)
    }
    map.on('style.load', handler)
    return () => {
      map.off('style.load', handler)
    }
  }, [map])

  useEffect(() => {
    if (!map || !mapLoaded || !events) return
    const features = events.map((event) => {
      const geohashes = event.getMatchingTags("g")
      if (!geohashes.length) return
      const { g } = Object.fromEntries(geohashes)
      const { lat, lon } = Geohash.decode(g)
      const geojson = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        id: event.id,
        properties: {
          id: event.id,
          content: event.content,
          author: event.author,
          created_at: event.created_at,
          kind: event.kind,
          tags: event.tags,
        }
      }
      return geojson
    })

    console.log('features', features)

    if (map.getLayer('nostr-event')) {
      map.removeLayer('nostr-event')
    }
    if (map.getSource('nostr-event')) {
      map.removeSource('nostr-event')
    }

    try {
      map.addSource('nostr-event', {
        type: "geojson",
        data: { type: "FeatureCollection", features, }
      })
    } catch (err) {

    }


    try {
      map.addLayer({
        id: 'nostr-event',
        type: "circle",
        source: "nostr-event",
        paint: {
          "circle-color": "#ff0000",
          "circle-radius": 12
        }
      })
    } catch (err) {

    }

  }, [mapLoaded, map, events])

  return (
    <div className="absolute left-0 top-0 w-80 flex flex-col">
      <Filter
        className="absolute top-2 left-2"
        onSearch={(condition) => {
          const { bbox, filter, geohash = "", places } = condition || {}
          const geohashFilter = []
          for (let i = 1; i < geohash.length; i++) {
            geohashFilter.push(geohash.slice(0, i + 1))
          }
          console.log('condition', condition)
          bbox && map?.fitBounds(bbox)
          console.log('geohashFilter', geohashFilter)
          fetchEvents({ "#g": geohashFilter })
        }}
      />
      <div className="bg-gray-800 h-80">{events.map(event => {
        return <div key={event.id}>{event.content}</div>
      })}</div>
    </div>
  )
}

export default MainPane
