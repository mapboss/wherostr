import { useContext, useEffect, useMemo, useState } from 'react'
import Filter from '@/components/Filter'
import ShortTextNoteCard from '@/components/displays/ShortTextNoteCard'
import { EventContext } from '@/contexts/EventContext'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import { Box, Paper } from '@mui/material'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { LngLatBounds } from 'maplibre-gl'

const MainPane = () => {
  const { fetchEvents, fetching, events, setEvents } = useContext(EventContext)
  const { map } = useContext(MapContext)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number]>()

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
    if (!map || !mapLoaded) return
    if (!boundingBox) return
    const bboxhash1 = Geohash.encode(boundingBox[1], boundingBox[0], 2)
    const bboxhash2 = Geohash.encode(boundingBox[3], boundingBox[2], 2)
    let geohashFilter = [bboxhash1, bboxhash2]
    geohashFilter.concat(Object.values(Geohash.neighbours(bboxhash1)))
    geohashFilter = geohashFilter.concat(Object.values(Geohash.neighbours(bboxhash2)))
    fetchEvents([{ kinds: [NDKKind.Text], '#g': geohashFilter }]).then(result => {
      const bounds = new LngLatBounds(boundingBox)
      const zoomBounds = new LngLatBounds()
      const events: NDKEvent[] = []
      const features = result.map((event) => {
        const geohashes = event.getMatchingTags('g')
        if (!geohashes.length) return
        const { g } = Object.fromEntries(geohashes)
        const { lat, lon } = Geohash.decode(g)
        if (!bounds.contains({ lat, lon })) return
        events.push(event)
        const geojson = {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          id: event.id,
          properties: {
            id: event.id,
            content: event.content,
            author: event.author,
            created_at: event.created_at,
            kind: event.kind,
            tags: event.tags,
          },
        }
        zoomBounds.extend({ lon, lat })
        return geojson
      }).filter(event => !!event)
      if (events.length > 0) {
        map.easeTo({ padding: { left: 400, right: 16 }, duration: 0 })
        map.fitBounds(zoomBounds, { duration: 300, maxZoom: 14 })
      } else {
        map.easeTo({ padding: { left: 0 } })
      }
      setEvents(events)
      if (map.getLayer('nostr-event')) {
        map.removeLayer('nostr-event')
      }
      if (map.getSource('nostr-event')) {
        map.removeSource('nostr-event')
      }
      try {
        map.addSource('nostr-event', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
        })
      } catch (err) { }

      try {
        map.addLayer({
          id: 'nostr-event',
          type: 'circle',
          source: 'nostr-event',
          paint: {
            'circle-color': '#ff0000',
            'circle-radius': 12,
          },
        })
      } catch (err) { }
    })


  }, [boundingBox, mapLoaded, map, fetchEvents, setEvents])

  const showEvents = useMemo(() => events?.length > 0, [events])

  return (
    <Paper
      className={`absolute left-0 top-0 w-[640px] flex flex-col !rounded-none max-h-full overflow-hidden${showEvents ? ' h-full' : ''
        }`}
    >
      <Filter
        onSearch={(condition) => {
          const { bbox } = condition || {}
          console.log('condition', condition)
          if (bbox) {
            setBoundingBox(bbox)
          } else {
            setBoundingBox(undefined)
          }
        }}
      />
      <div className="w-full h-0.5 background-gradient"></div>
      {showEvents && (
        <Box className="overflow-y-auto">
          {events.map((event) => (
            <ShortTextNoteCard key={event.id} event={event} />
          ))}
        </Box>
      )}
    </Paper>
  )
}

export default MainPane
