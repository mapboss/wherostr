import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Filter, { SearchPayload } from '@/components/Filter'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import { EventContext } from '@/contexts/EventContext'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import { Box, Paper } from '@mui/material'
import { LngLatBounds } from 'maplibre-gl'
import { NostrContext } from '@/contexts/NostrContext'
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk'

const MainPane = () => {
  const { map } = useContext(MapContext)
  const { ndk } = useContext(NostrContext)
  const { events, setEvents } = useContext(EventContext)
  const [mapLoaded, setMapLoaded] = useState(false)

  const fetchEvents = useCallback(async (payload: SearchPayload = {}) => {
    const { bbox, keyword } = payload
    let filter: NDKFilter = { kinds: [NDKKind.Text] }
    if (bbox) {
      let geohashFilter: string[] = []
      const bboxhash1 = Geohash.encode(bbox[1], bbox[0], 3)
      const bboxhash2 = Geohash.encode(bbox[3], bbox[2], 3)
      geohashFilter = [bboxhash1, bboxhash2]
      geohashFilter.concat(Object.values(Geohash.neighbours(bboxhash1)))
      geohashFilter = geohashFilter.concat(Object.values(Geohash.neighbours(bboxhash2)))
      filter["#g"] = geohashFilter
    } else {
      filter.search = keyword
    }
    const data = await ndk?.fetchEvents(filter)
    if (!data) {
      setEvents([])
      return
    }
    if (!bbox) {
      setEvents(Array.from(data))
      return
    }
    const bounds = new LngLatBounds(bbox)
    const items: NDKEvent[] = []
    data.forEach(d => {
      const geohashes = getTagValues(d.tags, 'g')
      if (!geohashes.length) return false
      geohashes.sort((a, b) => b.length - a.length)
      const { lat, lon } = Geohash.decode(geohashes[0])
      if (!bounds.contains({ lat, lon })) return false
      items.push(d)
    })
    setEvents(items)
  }, [ndk])

  const mouseEnterHandler = useCallback((ev: maplibregl.MapMouseEvent) => {
    const style = ev.target.getCanvas().style
    style.cursor = "pointer"
  }, [])

  const mouseOutHandler = useCallback((ev: maplibregl.MapMouseEvent) => {
    const style = ev.target.getCanvas().style
    style.cursor = ""
  }, [])


  const clickHandler = useCallback((ev: maplibregl.MapMouseEvent & {
    features?: maplibregl.MapGeoJSONFeature[] | undefined;
  } & Object) => {
    console.log('ev.features', ev.features)
  }, [])

  useEffect(() => {
    if (!map) return
    const handler = (evt: maplibregl.MapLibreEvent) => {
      setMapLoaded(true)
    }
    map.on('style.load', handler)
    map.on('mouseenter', 'nostr-event', mouseEnterHandler)
    map.on('mouseout', 'nostr-event', mouseOutHandler)
    map.on('click', 'nostr-event', clickHandler)
    return () => {
      map.off('style.load', handler)
      map.off('mouseenter', mouseEnterHandler)
      map.off('mouseout', mouseOutHandler)
      map.off('click', clickHandler)
    }
  }, [map, clickHandler, mouseEnterHandler, mouseOutHandler])

  useEffect(() => {
    if (!map || !mapLoaded) return
    if (map.getLayer('nostr-event')) {
      map.removeLayer('nostr-event')
    }
    if (map.getSource('nostr-event')) {
      map.removeSource('nostr-event')
    }

    const zoomBounds = new LngLatBounds()
    const features = events.map((event) => {
      const geohashes = getTagValues(event.tags, 'g')
      geohashes.sort((a, b) => b.length - a.length)
      const { lat, lon } = Geohash.decode(geohashes[0])
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
      map?.easeTo({ padding: { left: 656, right: 16 }, duration: 0 })
      if (!zoomBounds.isEmpty()) {
        map?.fitBounds(zoomBounds, { duration: 300, maxZoom: 14 })
      }
    } else {
      map?.easeTo({ padding: { left: 0, right: 0 } })
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
  }, [events, map, mapLoaded])

  const showEvents = useMemo(() => !!events?.length, [events])

  return (
    <Paper
      className={`absolute left-0 top-0 w-[640px] flex flex-col !rounded-none overflow-hidden${showEvents ? ' h-full' : ''
        }`}
    >
      <Filter onSearch={fetchEvents} />
      <Box className="w-full h-0.5 shrink-0 background-gradient"></Box>
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