import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Filter, { SearchPayload } from '@/components/Filter'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import { EventContext } from '@/contexts/EventContext'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import { Box, Paper } from '@mui/material'
import { LngLatBounds } from 'maplibre-gl'
import { NostrContext } from '@/contexts/NostrContext'
import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk'
import usePromise from 'react-use-promise'

const handleSortDescending = (a: NDKEvent, b: NDKEvent) =>
  (b.created_at || 0) - (a.created_at || 0)

const MainPane = () => {
  const { map } = useContext(MapContext)
  const { ndk } = useContext(NostrContext)
  const { events, setEvents } = useContext(EventContext)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [payload, setPayload] = useState<SearchPayload>({})

  const [geoData, geoError, geoStat] = usePromise(async () => {
    const bbox = payload.bbox
    if (!ndk || !bbox) return new Set<NDKEvent>()
    let geohashFilter: Set<string>
    const bboxhash1 = Geohash.encode(bbox[1], bbox[0], 1)
    const bboxhash2 = Geohash.encode(bbox[3], bbox[2], 1)
    const bboxhash3 = Geohash.encode(bbox[1], bbox[2], 1)
    const bboxhash4 = Geohash.encode(bbox[3], bbox[0], 1)
    geohashFilter = new Set([bboxhash1, bboxhash2, bboxhash3, bboxhash4])
    const result = await ndk.fetchEvents(
      { kinds: [NDKKind.Text], '#g': Array.from(geohashFilter) },
      {
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        closeOnEose: true,
      },
    )
    const bounds = new LngLatBounds(bbox)
    const data = new Set<NDKEvent>()
    result.forEach((d) => {
      const geohashes = d.getMatchingTags('g')
      if (!geohashes.length) return
      geohashes.sort((a, b) => b[1].length - a[1].length)
      if (!geohashes[0]) return
      const { lat, lon } = Geohash.decode(geohashes[0][1])
      if (!bounds.contains({ lat, lon })) return
      data.add(d)
    })
    return data
  }, [payload.bbox])

  const [tagData, tagError, tagStat] = usePromise(async () => {
    const keyword = payload.keyword
    if (!ndk || !keyword) return new Set<NDKEvent>()

    return ndk.fetchEvents(
      { kinds: [NDKKind.Text], '#t': keyword.split(' ') },
      {
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        closeOnEose: true,
      },
    )
  }, [payload.keyword])

  useEffect(() => {
    if (tagStat === 'pending' || geoStat === 'pending') return
    if (!tagData || !geoData) return
    geoData.forEach((d) => {
      tagData.add(d)
    })
    setEvents(Array.from(tagData).sort(handleSortDescending))
  }, [geoData, tagData, tagStat, geoStat, setEvents])

  const mouseEnterHandler = useCallback((ev: maplibregl.MapMouseEvent) => {
    const style = ev.target.getCanvas().style
    style.cursor = 'pointer'
  }, [])

  const mouseOutHandler = useCallback((ev: maplibregl.MapMouseEvent) => {
    const style = ev.target.getCanvas().style
    style.cursor = ''
  }, [])

  const clickHandler = useCallback(
    (
      ev: maplibregl.MapMouseEvent & {
        features?: maplibregl.MapGeoJSONFeature[] | undefined
      } & Object,
    ) => {
      console.log('ev.features', ev.features)
    },
    [],
  )

  useEffect(() => {
    if (!map) return
    const handler = (evt: maplibregl.MapLibreEvent) => {
      setMapLoaded(true)
    }
    console.log('on.style.load')
    map.on('style.load', handler)
    map.on('mouseenter', 'nostr-event', mouseEnterHandler)
    map.on('mouseout', 'nostr-event', mouseOutHandler)
    map.on('click', 'nostr-event', clickHandler)
    return () => {
      console.log('off.style.load')
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
    const features = events
      .map((event) => {
        const geohashes = event.getMatchingTags('g')
        if (!geohashes.length) return
        geohashes.sort((a, b) => b[1].length - a[1].length)
        if (!geohashes[0]) return
        const { lat, lon } = Geohash.decode(geohashes[0][1])
        if (!lat || !lon) return
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
      })
      .filter((event) => !!event)

    if (features.length > 0) {
      // map?.easeTo({ padding: { left: 656, right: 16 }, duration: 300 })
      if (!zoomBounds.isEmpty()) {
        map?.fitBounds(zoomBounds, {
          duration: 1000,
          maxZoom: 14,
          padding: { left: 656, right: 16 },
        })
      }
    } else {
      map?.easeTo({ padding: { left: 0, right: 0 } })
    }

    try {
      map?.addSource('nostr-event', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      })
    } catch (err) {}

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
    } catch (err) {}
  }, [events, map, mapLoaded])

  const showEvents = useMemo(() => !!events?.length, [events])

  return (
    <Paper
      className={`absolute left-0 top-0 w-[640px] flex flex-col !rounded-none overflow-hidden${
        showEvents ? ' h-full' : ''
      }`}
    >
      <Filter onSearch={(payload) => setPayload(payload || {})} />
      <Box className="w-full h-0.5 shrink-0 background-gradient"></Box>
      {showEvents && (
        <Box className="overflow-y-auto">
          {events?.map((event, i) => (
            <ShortTextNoteCard key={i} event={event} />
          ))}
        </Box>
      )}
    </Paper>
  )
}

export default MainPane

export function getTagValues(tags: string[][], tag: string): Array<string> {
  return tags
    .filter((t) => t.at(0) === tag)
    .map((t) => t.at(1))
    .filter((t) => t)
    .map((t) => t as string)
}
