import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import EventActionModal from '@/components/EventActionModal'
import ProfileActionModal from '@/components/ProfileActionModal'
import EventList from '@/components/EventList'
import Filter, { SearchPayload } from '@/components/Filter'
import { EventActionType, AppContext } from '@/contexts/AppContext'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Tooltip,
} from '@mui/material'
import { LngLatBounds } from 'maplibre-gl'
import { NDKEvent, NDKKind, NostrEvent } from '@nostr-dev-kit/ndk'
import {
  DescriptionOutlined,
  Draw,
  LocationOn,
  NotesOutlined,
  Place,
  TravelExplore,
} from '@mui/icons-material'
import pin from '@/public/pin.svg'
import { useSubscribe } from '@/hooks/useSubscribe'
import { useUserStore } from '@/hooks/useUserStore'
import { AccountContext } from '@/contexts/AccountContext'

const handleSortDescending = (a: NDKEvent, b: NDKEvent) =>
  (b.created_at || 0) - (a.created_at || 0)

const MainPane = () => {
  const { map } = useContext(MapContext)
  const { user } = useContext(AccountContext)
  const { profileAction, events, eventAction, setEvents, setEventAction } =
    useContext(AppContext)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [payload, setPayload] = useState<SearchPayload>({})
  const [tabIndex, setTabIndex] = useState(0)

  useEffect(() => {
    setEvents([])
  }, [payload, setEvents])

  useEffect(() => {
    if (!events.length && !!payload.places?.length) {
      setTabIndex(1)
    } else {
      setTabIndex(0)
    }
  }, [events.length, payload.places?.length])

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

  const [subGeoFilter] = useSubscribe(geohashFilter)
  const [subTagFilter, fetchMore] = useSubscribe(tagsFilter)

  useEffect(() => {
    if (!subTagFilter || !subGeoFilter) return
    const data = new Set<NDKEvent>(subTagFilter)
    if (!bounds.isEmpty()) {
      subGeoFilter.forEach((d) => {
        if (data.has(d)) return
        const geohashes = d.getMatchingTags('g')
        if (!geohashes.length) return
        geohashes.sort((a, b) => b[1].length - a[1].length)
        if (!geohashes[0]) return
        const { lat, lon } = Geohash.decode(geohashes[0][1])
        if (!bounds.contains({ lat, lon })) return
        data.add(d)
      })
    }
    let ids = new Set<string>()
    setEvents(
      Array.from(data)
        .filter((item) => {
          if (!ids.has(item.id)) {
            ids.add(item.id)
            return true
          }
        })
        .sort(handleSortDescending),
    )
  }, [bounds, subGeoFilter, subTagFilter, setEvents])

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

    if (events.length > 0) {
      map?.easeTo({ padding: { left: 512, right: 32, top: 32 }, duration: 0 })
    }
    if (!zoomBounds.isEmpty()) {
      map?.fitBounds(zoomBounds, {
        duration: 1000,
        maxZoom: 14,
      })
    }

    try {
      ;(map.getSource('nostr-event') as any)?.setData({
        type: 'FeatureCollection',
        features,
      })
    } catch (err) {}
  }, [events, map])

  const showEvents = useMemo(
    () => !!events?.length || !!payload.places?.length,
    [events, payload.places],
  )
  const handleClickPost = useCallback(() => {
    setEventAction({
      type: EventActionType.Create,
    })
  }, [setEventAction])

  return (
    <Paper
      className={`absolute left-0 top-0 w-full md:w-[496px] xl:w-[640px] flex flex-col !rounded-none overflow-hidden${
        profileAction || eventAction || showEvents ? ' h-full' : ''
      }`}
    >
      <Box className="px-4 py-2 flex gap-4 items-center">
        <Filter
          className="grow"
          onSearch={(payload) => setPayload(payload || {})}
        />
        {user?.npub && (
          <Tooltip title="Post">
            <IconButton
              className="background-gradient"
              size="large"
              onClick={handleClickPost}
            >
              <Draw />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box className="w-full h-0.5 shrink-0 background-gradient" />
      {showEvents && (
        <>
          <Box>
            <Tabs value={tabIndex} onChange={(_, value) => setTabIndex(value)}>
              {!!events.length ? (
                <Tab
                  value={0}
                  label="Notes"
                  icon={<DescriptionOutlined />}
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
              ) : null}
              {!!payload?.places?.length ? (
                <Tab
                  value={1}
                  label="Places"
                  icon={<Place />}
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
              ) : null}
            </Tabs>
          </Box>
          {tabIndex === 0 && (
            <EventList events={events} onNeedFetch={fetchMore} />
          )}
          {tabIndex === 1 && (
            <Box className="overflow-y-auto">
              <List disablePadding>
                {payload.places?.map((item) => {
                  return (
                    <ListItem key={item.place_id}>
                      <ListItemAvatar>
                        <Avatar>
                          <Place />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                        secondary={item.display_name}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => {
                            const [y1, y2, x1, x2] = item.boundingbox.map(
                              (b: string) => Number(b),
                            )
                            const bounds: [number, number, number, number] = [
                              x1,
                              y1,
                              x2,
                              y2,
                            ]
                            map?.fitBounds(bounds, {
                              maxZoom: 14,
                              duration: 300,
                            })
                          }}
                        >
                          <TravelExplore />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          )}
        </>
      )}

      {eventAction && (
        <Box className="absolute left-0 top-0 w-full md:w-[496px] xl:w-[640px] h-full p-8 backdrop-blur">
          <EventActionModal />
        </Box>
      )}
      {profileAction && (
        <Box className="absolute left-0 top-0 w-full md:w-[496px] xl:w-[640px] h-full p-8 backdrop-blur">
          <ProfileActionModal />
        </Box>
      )}
    </Paper>
  )
}

export default MainPane
