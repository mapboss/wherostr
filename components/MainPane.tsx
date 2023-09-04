import { useContext, useEffect, useMemo, useState } from 'react'
import Filter, { SearchPayload } from '@/components/Filter'
import ShortTextNoteCard from '@/components/displays/ShortTextNoteCard'
import { EventContext } from '@/contexts/EventContext'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import { Box, Paper } from '@mui/material'
import { LngLatBounds } from 'maplibre-gl'
import { FlatNoteStore, RequestBuilder, TaggedNostrEvent } from '@snort/system'
import { useRequestBuilder } from '@snort/system-react'

const MainPane = () => {
  const { map } = useContext(MapContext)
  const { events, setEvents } = useContext(EventContext)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [payload, setPayload] = useState<SearchPayload>({})
  const { bbox, keyword } = payload
  const sub = useMemo(() => {
    if (!keyword || !bbox) return null
    const qg = new RequestBuilder("query-group");
    const filterByKeyword = new RequestBuilder("filter-keyword");
    filterByKeyword.withFilter().kinds([1]).limit(100).search(keyword)
    qg.add(filterByKeyword)
    if (bbox) {
      let geohashFilter: string[] = []
      const filterByGeohash = new RequestBuilder("filter-geohash");
      const bboxhash1 = Geohash.encode(bbox[1], bbox[0], 2)
      const bboxhash2 = Geohash.encode(bbox[3], bbox[2], 2)
      geohashFilter = [bboxhash1, bboxhash2]
      geohashFilter.concat(Object.values(Geohash.neighbours(bboxhash1)))
      geohashFilter = geohashFilter.concat(Object.values(Geohash.neighbours(bboxhash2)))
      filterByGeohash.withFilter().kinds([1]).limit(100).tag("g", geohashFilter)
      qg.add(filterByGeohash)
    }
    return qg
  }, [bbox, keyword]);
  const { data, loading } = useRequestBuilder<FlatNoteStore>(FlatNoteStore, sub)

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
    if (!loading()) return
    if (map.getLayer('nostr-event')) {
      map.removeLayer('nostr-event')
    }
    if (map.getSource('nostr-event')) {
      map.removeSource('nostr-event')
    }
    if (!data) {
      setEvents([])
      return
    }
    const events: TaggedNostrEvent[] = []
    if (bbox) {
      const bounds = new LngLatBounds(bbox)
      const zoomBounds = new LngLatBounds()
      const features = data.map((event) => {
        const geohashes = getTagValues(event.tags, 'g')
        if (!geohashes.length) {
          events.push(event)
          return
        }
        geohashes.sort((a, b) => b.length - a.length)
        const { lat, lon } = Geohash.decode(geohashes[0])
        if (!bounds.contains({ lat, lon })) return
        events.push(event)
        const geojson = {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          id: event.id,
          properties: {
            id: event.id,
            content: event.content,
            author: event.pubkey,
            created_at: event.created_at,
            kind: event.kind,
            tags: event.tags,
          },
        }
        zoomBounds.extend({ lon, lat })
        return geojson
      }).filter(event => !!event)

      if (events.length > 0) {
        map?.easeTo({ padding: { left: 400, right: 16 }, duration: 0 })
        if (!zoomBounds.isEmpty()) {
          map?.fitBounds(zoomBounds, { duration: 300, maxZoom: 14 })
        }
      } else {
        map?.easeTo({ padding: { left: 0 } })
      }

      try {
        map?.addSource('nostr-event', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
        })
      } catch (err) { }

      try {
        map?.addLayer({
          id: 'nostr-event',
          type: 'circle',
          source: 'nostr-event',
          paint: {
            'circle-color': '#ff0000',
            'circle-radius': 12,
          },
        })
      } catch (err) { }
    }
    setEvents(events)
  }, [bbox, data, loading, map, mapLoaded, setEvents])

  const showEvents = useMemo(() => !!events?.length, [events])

  return (
    <Paper
      className={`absolute left-0 top-0 w-[640px] flex flex-col !rounded-none max-h-full overflow-hidden${showEvents ? ' h-full' : ''
        }`}
    >
      <Filter
        onSearch={(condition) => {
          console.log('condition', condition)
          if (condition) {
            setPayload(condition)
          } else {
            setPayload({})
          }
        }}
      />
      <div className="w-full h-0.5 background-gradient"></div>
      {showEvents && (
        <Box className="overflow-y-auto">
          {events?.map((event) => (
            <ShortTextNoteCard key={event.id} event={event} />
          ))}
        </Box>
      )}
    </Paper>
  )
}

export default MainPane


export function getTagValues(tags: string[][], tag: string): Array<string> {
  return tags
    .filter(t => t.at(0) === tag)
    .map(t => t.at(1))
    .filter(t => t)
    .map(t => t as string);
}