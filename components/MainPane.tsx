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
  Divider,
  Fab,
  Hidden,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  useMediaQuery,
  useTheme,
  Zoom,
} from '@mui/material'
import { LngLatBounds } from 'maplibre-gl'
import { NDKEvent, NDKKind, NostrEvent } from '@nostr-dev-kit/ndk'
import { Draw, Place, TravelExplore } from '@mui/icons-material'
import pin from '@/public/pin.svg'
import { useSubscribe } from '@/hooks/useSubscribe'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import UserBar from './UserBar'
import classNames from 'classnames'
import { DAY, unixNow } from '@/utils/time'
import { useAccount, useFollowing, useMuting } from '@/hooks/useAccount'
import DrawerMenu from './DrawerMenu'

const handleSortDescending = (a: NDKEvent, b: NDKEvent) =>
  (b.created_at || 0) - (a.created_at || 0)

const MainPane = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { map } = useContext(MapContext)
  const { user, signing } = useAccount()
  const [follows] = useFollowing()
  const { profileAction, events, eventAction, setEvents, setEventAction } =
    useContext(AppContext)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [payload, setPayload] = useState<SearchPayload>({})
  const theme = useTheme()
  const xlUp = useMediaQuery(theme.breakpoints.up('lg'))
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  const mdDown = useMediaQuery(theme.breakpoints.down('md'))
  const showMap = searchParams.get('map') === '1'
  const q = useMemo(() => searchParams.get('q') || '', [searchParams])
  const [showComments, setShowComments] = useState(false)
  const [tabValue, setTabValue] = useState<
    'places' | 'notes' | 'conversations'
  >('notes')
  const feedType = useMemo(() => {
    if (user) {
      if (!q || q === 'follows') {
        return 'follows'
      }
    }
    return 'global'
  }, [user, q])

  useEffect(() => {
    setEvents([])
  }, [payload, setEvents])

  // useEffect(() => {
  //   if (!events.length && !!payload.places?.length) {
  //     setTabIndex(1)
  //   } else {
  //     setTabIndex(0)
  //   }
  // }, [events.length, payload.places?.length])

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
      kinds: [NDKKind.Text, NDKKind.Repost],
      '#g': Array.from(geohashFilter),
    }
  }, [payload.bbox])

  const tagsFilter = useMemo(() => {
    if (signing) return
    const tags =
      q && q !== 'follows' && q !== 'global'
        ? new Set(q.split(/\s|,/).map((d) => d.trim().toLowerCase()))
        : undefined

    const authors =
      user && (!q || q === 'follows')
        ? follows.map((d) => d.hexpubkey)
        : undefined

    return {
      ...(tags ? { '#t': Array.from(tags) } : undefined),
      authors,
      kinds: [NDKKind.Text, NDKKind.Repost],
      since: unixNow() - DAY,
      limit: 30,
    }
  }, [signing, q, user, follows])

  const [subGeoFilter] = useSubscribe(geohashFilter)
  const [subTagFilter, fetchMore, newItems, showNewItems] =
    useSubscribe(tagsFilter)

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
          if (ids.has(item.id)) return false
          ids.add(item.id)
          return true
        })
        .sort(handleSortDescending),
    )
  }, [showComments, bounds, subGeoFilter, subTagFilter, setEvents])

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
      router.replace(`${pathname}?q=${q || ''}`)
      setEventAction({
        type: EventActionType.View,
        event,
        options: {
          comments: true,
        },
      })
    },
    [events, pathname, q, router, setEventAction],
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

    try {
      if (!zoomBounds.isEmpty()) {
        map.fitBounds(zoomBounds, { animate: false, maxZoom: 15 })
      }
      ;(map.getSource('nostr-event') as any)?.setData({
        type: 'FeatureCollection',
        features,
      })
    } catch (err) {}
  }, [events, map])

  const showEvents = useMemo(
    () => !!events?.length && (!mdDown || !showMap),
    [events, mdDown, showMap],
  )
  const showOnlyMap = useMemo(() => mdDown && showMap, [mdDown, showMap])

  const showPanel = useMemo(
    () => profileAction || eventAction || showEvents || !showOnlyMap,
    [profileAction, eventAction, showEvents, showOnlyMap],
  )
  const handleClickPost = useCallback(() => {
    setEventAction({
      type: EventActionType.Create,
    })
  }, [setEventAction])

  useEffect(() => {
    if (!map) return
    const basePadding = 32
    const left = xlUp ? 640 : mdUp ? 640 : 0
    if (showPanel) {
      map.easeTo({
        padding: {
          left: left + basePadding,
          right: basePadding,
          top: basePadding,
          bottom: basePadding,
        },
        animate: false,
        easeId: 'mainpane',
      })
    } else {
      map.easeTo({
        padding: {
          left: basePadding,
          right: basePadding,
          top: basePadding,
          bottom: basePadding,
        },
        animate: false,
        easeId: 'mainpane',
      })
    }
  }, [map, showPanel, mdUp, xlUp])

  const onSearch = useCallback((payload: SearchPayload = {}) => {
    setPayload(payload)
  }, [])

  return (
    <Paper
      className={classNames(
        'absolute left-0 top-0 w-full md:w-[640px] flex flex-col !rounded-none overflow-hidden',
        {
          'h-full': !showOnlyMap,
          'h-[66px]': showOnlyMap,
        },
      )}
    >
      <Toolbar className="gap-3 items-center !px-3 !min-h-[64px]">
        {user?.hexpubkey ? (
          <DrawerMenu hexpubkey={user.hexpubkey} />
        ) : (
          <UserBar />
        )}
        <Filter feedType={feedType} className="grow" onSearch={onSearch} />
        {user?.hexpubkey && (
          <Hidden mdDown>
            <Tooltip title="Post">
              <IconButton
                className="bg-gradient-primary"
                size="large"
                onClick={handleClickPost}
              >
                <Draw />
              </IconButton>
            </Tooltip>
          </Hidden>
        )}
      </Toolbar>
      <Box className="w-full h-0.5 shrink-0 bg-gradient-primary" />
      <Tabs
        variant="fullWidth"
        value={tabValue}
        onChange={(_, value) => {
          setShowComments(value === 'conversations')
          setTabValue(value)
        }}
      >
        {!!payload.places?.length ? (
          <Tab label="Places" value="places" />
        ) : undefined}
        <Tab label="Notes" value="notes" />
        <Tab label="Conversations" value="conversations" />
      </Tabs>
      <Divider />
      {tabValue !== 'places' ? (
        <EventList
          events={events}
          onFetchMore={fetchMore}
          newItems={newItems}
          onShowNewItems={showNewItems}
          showComments={showComments}
        />
      ) : (
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
                          maxZoom: 18,
                          duration: 1000,
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
      {eventAction ? (
        <Box
          className={classNames(
            'fixed left-0 top-0 w-full md:w-[640px] h-full p-2 sm:p-3 md:p-6 backdrop-blur z-50',
            {
              hidden: showMap && mdDown,
            },
          )}
        >
          <EventActionModal />
        </Box>
      ) : null}
      {profileAction && (
        <Box className="fixed left-0 top-0 w-full md:w-[640px] h-full p-2 sm:p-3 md:p-6 backdrop-blur z-50">
          <ProfileActionModal />
        </Box>
      )}
      <Zoom in={!showMap && mdDown && !!user?.hexpubkey}>
        <Fab
          className="!fixed !bg-gradient-primary !z-40 bottom-6 right-6"
          size="medium"
          onClick={handleClickPost}
        >
          <Draw className="text-[white]" />
        </Fab>
      </Zoom>
    </Paper>
  )
}

export default MainPane
