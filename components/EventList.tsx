'use client'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import {
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Slide,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material'
import { ViewportList } from 'react-viewport-list'
import { Note, Place } from '@mui/icons-material'

const EventList = ({
  enableTab = false,
  events = [],
  places = [],
  onNeedFetch,
}: {
  enableTab?: boolean
  events?: NDKEvent[]
  places?: any[]
  onNeedFetch?: () => Promise<NDKEvent[] | undefined>
}) => {
  const noteRef = useRef(null)
  const placeRef = useRef(null)
  const totalEvent = useMemo(() => events.length || 0, [events.length])
  const totalPlace = useMemo(() => places.length || 0, [places.length])
  const [scrollEnd, setScrollEnd] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [hasNext, setHasNext] = useState(true)
  const [tabIndex, setTabIndex] = useState(0)

  useEffect(() => {
    if (totalEvent > 0) {
      setHasNext(true)
    }
  }, [totalEvent])

  useEffect(() => {
    if (totalEvent > 0) {
      setTabIndex(0)
    } else if (totalPlace > 0) {
      setTabIndex(1)
    }
  }, [totalPlace, totalEvent])

  const onViewportIndexesChange = useCallback(
    async ([current, next]: [number, number]) => {
      const percent = (next / (totalEvent - 1)) * 100
      setScrollEnd(percent === 100)
      if (fetching || !hasNext) return
      if (percent < 90) return
      setFetching(true)
      const items = await onNeedFetch?.()
      setFetching(false)
      setHasNext(!!items?.length)
    },
    [hasNext, fetching, totalEvent, onNeedFetch],
  )

  return (
    <>
      <Box ref={noteRef} className="overflow-y-auto">
        <ViewportList
          viewportRef={noteRef}
          items={events}
          onViewportIndexesChange={onViewportIndexesChange}
          withCache
        >
          {(item) => <ShortTextNoteCard key={item.id} event={item} />}
        </ViewportList>
      </Box>
      {fetching && <LinearProgress sx={{ minHeight: 4 }} />}
      <Slide
        in={scrollEnd && !hasNext}
        direction="up"
        appear={false}
        unmountOnExit
        mountOnEnter
      >
        <Typography
          color="text.secondary"
          className="flex flex-1 justify-center items-end !py-2 italic"
        >
          No more content.
        </Typography>
      </Slide>
    </>
  )
}

export default EventList
