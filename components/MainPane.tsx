import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import EventActionModal from '@/components/EventActionModal'
import ProfileActionModal from '@/components/ProfileActionModal'
import EventList from '@/components/EventList'
import Filter from '@/components/Filter'
import { EventActionType, AppContext } from '@/contexts/AppContext'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import {
  Box,
  Chip,
  Divider,
  Fab,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  useMediaQuery,
  useTheme,
  Zoom,
} from '@mui/material'
import { LngLatBounds } from 'maplibre-gl'
import { NDKEvent, NDKFilter, NDKKind, NostrEvent } from '@nostr-dev-kit/ndk'
import { CropFree, Draw, Pin, Tag } from '@mui/icons-material'
import pin from '@/public/pin.svg'
import { useSubscribe } from '@/hooks/useSubscribe'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import UserBar from './UserBar'
import classNames from 'classnames'
import { DAY, unixNow } from '@/utils/time'
import { useAccount, useFollowing } from '@/hooks/useAccount'
import DrawerMenu from './DrawerMenu'
import { extractQuery } from '@/utils/extractQuery'

const handleSortDescending = (a: NDKEvent, b: NDKEvent) =>
  (b.created_at || 0) - (a.created_at || 0)

const MainPane = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { map } = useContext(MapContext)
  const { user, signing, readOnly } = useAccount()
  const [follows] = useFollowing()
  const { profileAction, events, eventAction, setEvents, setEventAction } =
    useContext(AppContext)
  const [mapLoaded, setMapLoaded] = useState(false)
  const theme = useTheme()
  const xlUp = useMediaQuery(theme.breakpoints.up('lg'))
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  const mdDown = useMediaQuery(theme.breakpoints.down('md'))
  const showMap = searchParams.get('map') === '1'
  const q = useMemo(() => searchParams.get('q') || '', [searchParams])
  const [showComments, setShowComments] = useState(false)
  const [tabValue, setTabValue] = useState<'notes' | 'conversations'>('notes')
  const feedType = useMemo(() => {
    if (user) {
      if (!q || q === 'follows') {
        return 'follows'
      }
    }
    return 'global'
  }, [user, q])

  const query = useMemo(() => extractQuery(q), [q])

  useEffect(() => {
    setEvents([])
  }, [query, setEvents])

  const bounds = useMemo(() => new LngLatBounds(query?.bbox), [query?.bbox])

  const geohashFilter = useMemo(() => {
    if (signing) return
    if (!query?.bbox) return
    const bbox = query.bbox
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
  }, [signing, query?.bbox])

  const authorsOrTags = useMemo(() => {
    const tags = query?.tags
      ? new Set(query?.tags.map((d) => d.trim().toLowerCase()))
      : undefined

    if (!!tags?.size) {
      return { '#t': Array.from(tags) }
    }
    if (follows && feedType === 'follows') {
      return { authors: follows.map((d) => d.hexpubkey) }
    }
  }, [follows, query?.tags, feedType])

  const tagsFilter = useMemo<NDKFilter | undefined>(() => {
    if (signing) return
    if (!authorsOrTags && query?.bbox) return
    return {
      ...authorsOrTags,
      kinds: [NDKKind.Text, NDKKind.Repost],
      since: unixNow() - DAY,
      limit: 30,
    } as NDKFilter
  }, [signing, query?.bbox, authorsOrTags])

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
        {!query ? (
          <Filter className="grow" />
        ) : (
          <Box mx="auto">
            {query.tags?.map((d) => (
              <Chip
                icon={<Tag />}
                key={d}
                label={d}
                onDelete={() =>
                  router.replace(
                    `${pathname}?q=${query.tags
                      ?.filter((tag) => tag !== d)
                      .map((d) => `t:${d}`)
                      .join(';')}&map=${showMap ? '1' : ''}`,
                  )
                }
              />
            ))}
            {query.bhash ? (
              <Chip
                icon={<CropFree />}
                key={query.bhash?.join(', ')}
                label={query.bhash?.join(', ')}
                onDelete={() =>
                  router.replace(`${pathname}?q=&map=${showMap ? '1' : ''}`)
                }
              />
            ) : undefined}
            {query.geohash ? (
              <Chip
                icon={<Pin />}
                key={query.geohash}
                label={query.geohash}
                onDelete={() =>
                  router.replace(`${pathname}?q=&map=${showMap ? '1' : ''}`)
                }
              />
            ) : undefined}
          </Box>
        )}
      </Toolbar>
      <Box className="w-full h-0.5 shrink-0 bg-gradient-primary" />
      {/* <Tabs
        variant="fullWidth"
        value={tabValue}
        onChange={(_, value) => {
          setShowComments(value === 'conversations')
          setTabValue(value)
        }}
      >
        <Tab label="Notes" value="notes" />
        <Tab label="Conversations" value="conversations" />
      </Tabs> */}
      <Divider />
      <EventList
        events={events}
        onFetchMore={fetchMore}
        newItems={newItems}
        onShowNewItems={showNewItems}
        showComments={!!query || showComments}
      />
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
      <Zoom in={!readOnly}>
        <Fab
          className="!fixed !bg-gradient-primary !z-40 bottom-6 right-6 md:right-auto md:left-[648px]"
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
