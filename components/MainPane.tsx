import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import EventActionModal from '@/components/EventActionModal'
import EventList from '@/components/EventList'
import Filter, { SearchPayload } from '@/components/Filter'
import { EventActionType, EventContext } from '@/contexts/EventContext'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import { Box, IconButton, Paper, Tooltip } from '@mui/material'
import { LngLatBounds } from 'maplibre-gl'
import { NostrContext } from '@/contexts/NostrContext'
import {
  NDKEvent,
  NDKKind,
  NDKSubscriptionCacheUsage,
  NostrEvent,
} from '@nostr-dev-kit/ndk'
import usePromise from 'react-use-promise'
import { Draw, LocationOn } from '@mui/icons-material'
import pin from '@/public/pin.svg'

const handleSortDescending = (a: NDKEvent, b: NDKEvent) =>
  (b.created_at || 0) - (a.created_at || 0)

const MainPane = () => {
  const { map } = useContext(MapContext)
  const { ndk } = useContext(NostrContext)
  const { events, eventAction, setEvents, setEventAction } =
    useContext(EventContext)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [payload, setPayload] = useState<SearchPayload>({})

  useEffect(() => {
    setEvents([])
  }, [payload, setEvents])

  const bounds = useMemo(() => new LngLatBounds(payload.bbox), [payload.bbox])

  const geohashFilter = useMemo(() => {
    if (!payload.bbox) return
    const bbox = payload.bbox
    let geohashFilter: Set<string>
    const bboxhash1 = Geohash.encode(bbox[1], bbox[0], 1)
    const bboxhash2 = Geohash.encode(bbox[3], bbox[2], 1)
    const bboxhash3 = Geohash.encode(bbox[1], bbox[2], 1)
    const bboxhash4 = Geohash.encode(bbox[3], bbox[0], 1)
    geohashFilter = new Set([bboxhash1, bboxhash2, bboxhash3, bboxhash4])
    return {
      kinds: [NDKKind.Text],
      '#g': Array.from(geohashFilter),
      limit: 50,
    }
  }, [payload.bbox])

  const tagsFilter = useMemo(() => {
    if (!payload.keyword) return
    const tags = new Set(
      payload.keyword.split(/\s|,/).map((d) => d.trim().toLowerCase()),
    )
    return { kinds: [NDKKind.Text], '#t': Array.from(tags), limit: 50 }
  }, [payload.keyword])

  const [geoData, geoError, geoStat] = usePromise(async () => {
    if (!ndk || !geohashFilter || bounds.isEmpty()) return new Set<NDKEvent>()
    const result = await ndk.fetchEvents(geohashFilter, {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      closeOnEose: true,
    })
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
  }, [bounds, geohashFilter])

  const [tagData, tagError, tagStat] = usePromise(async () => {
    if (!ndk || !tagsFilter) return new Set<NDKEvent>()
    return ndk.fetchEvents(tagsFilter, {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      closeOnEose: true,
    })
  }, [tagsFilter])

  useEffect(() => {
    if (tagStat === 'pending' || geoStat === 'pending') return
    if (!tagData || !geoData) return
    geoData.forEach((d) => {
      tagData.add(d)
    })
    let ids = new Set<string>()
    setEvents(
      Array.from(tagData)
        .filter((item) => {
          if (!ids.has(item.id)) {
            ids.add(item.id)
            return true
          }
        })
        .sort(handleSortDescending),
    )
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
      const feat = ev?.features?.[0]?.properties as NostrEvent
      const event = events.find((ev) => ev.id === feat.id)
      if (!event) return
      setEventAction({
        type: EventActionType.View,
        event,
        options: {
          quotes: true,
          comments: true,
          reposts: true,
        },
      })
    },
    [events, setEventAction],
  )

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
    const img = new Image()
    img.onload = () => map.addImage('pin', img)
    img.src = pin.src

    map.addSource('nostr-event', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
    map.addLayer({
      id: 'nostr-event',
      type: 'symbol',
      source: 'nostr-event',
      layout: {
        'icon-image': 'pin',
        'icon-size': 0.25,
        'icon-offset': [0, -64],
      },
    })
  }, [mapLoaded, map])

  useEffect(() => {
    if (!map) return

    const zoomBounds = new LngLatBounds()
    const features = events
      .map((event) => {
        const geohashes = event.getMatchingTags('g')
        if (!geohashes.length) return
        geohashes.sort((a, b) => b[1].length - a[1].length)
        if (!geohashes[0]) return
        const { lat, lon } = Geohash.decode(geohashes[0][1])
        if (!lat || !lon) return
        const nostrEvent = event.rawEvent()
        const geojson = {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          id: event.id,
          properties: nostrEvent,
        }
        zoomBounds.extend({ lon, lat })
        return geojson
      })
      .filter((event) => !!event)

    if (features.length > 0) {
      map?.easeTo({ padding: { left: 656, right: 16, top: 16 }, duration: 0 })
      if (!zoomBounds.isEmpty()) {
        map?.fitBounds(zoomBounds, {
          duration: 1000,
          maxZoom: 14,
        })
      }
    } else {
      map?.easeTo({ padding: { left: 0, right: 0 } })
    }

    try {
      ;(map.getSource('nostr-event') as any)?.setData({
        type: 'FeatureCollection',
        features,
      })
    } catch (err) {}
  }, [events, map])

  const showEvents = useMemo(() => !!events?.length, [events])
  const handleClickPost = useCallback(() => {
    setEventAction({
      type: EventActionType.Create,
    })
  }, [setEventAction])
  return (
    <Paper
      className={`absolute left-0 top-0 w-[640px] flex flex-col !rounded-none overflow-hidden${
        eventAction || showEvents ? ' h-full' : ''
      }`}
    >
      <Box className="px-4 py-2 flex gap-4 items-center">
        <Filter
          className="grow"
          onSearch={(payload) => setPayload(payload || {})}
        />
        <Tooltip title="Post">
          <IconButton
            className="background-gradient"
            size="large"
            onClick={handleClickPost}
          >
            <Draw />
          </IconButton>
        </Tooltip>
      </Box>
      <Box className="w-full h-0.5 shrink-0 background-gradient"></Box>
      {showEvents && <EventList events={events} />}
      {eventAction && (
        <Box className="absolute left-0 top-0 w-[640px] h-full p-8 backdrop-blur">
          <EventActionModal />
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
