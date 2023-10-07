'use client'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import {
  FC,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import { Box, Chip, LinearProgress, Slide, Typography } from '@mui/material'
import { ViewportList, ViewportListRef } from 'react-viewport-list'
import { SubscribeResult } from '@/hooks/useSubscribe'
import { ArrowUpward } from '@mui/icons-material'

export interface EventListProps {
  events?: NDKEvent[]
  parentRef?: RefObject<HTMLElement> | null
  onFetchMore?: SubscribeResult[1]
  newItems?: SubscribeResult[2]
  onShowNewItems?: SubscribeResult[3]
}

const EventList: FC<EventListProps> = ({
  events = [],
  parentRef = null,
  newItems = [],
  onFetchMore,
  onShowNewItems,
}) => {
  const noteRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<ViewportListRef>(null)
  const totalEvent = useMemo(() => events.length || 0, [events.length])
  const [scrollEnd, setScrollEnd] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [hasNext, setHasNext] = useState(true)

  useEffect(() => {
    if (totalEvent > 0) {
      setHasNext(true)
    }
  }, [totalEvent])

  const onViewportIndexesChange = useCallback(
    async ([current, next]: [number, number]) => {
      const percent = ((next + 1) / totalEvent) * 100
      setScrollEnd(percent === 100)
      if (fetching || !hasNext) return
      if (percent < 90) return
      setFetching(true)
      const items = await onFetchMore?.()
      setFetching(false)
      setHasNext(!!items?.length)
    },
    [hasNext, fetching, totalEvent, onFetchMore],
  )

  return (
    <>
      <Box
        ref={!parentRef ? noteRef : undefined}
        className="overflow-y-auto relative"
      >
        <Slide in={!!newItems.length} unmountOnExit>
          <Box className="sticky z-10 top-2 left-0 right-0 text-center opacity-80">
            <Chip
              color="secondary"
              label={`${newItems.length} new note${
                newItems.length > 1 ? 's' : ''
              }`}
              onClick={() => {
                onShowNewItems?.()
                setTimeout(() => {
                  scrollRef.current?.scrollToIndex({ index: 0 })
                }, 100)
              }}
              icon={<ArrowUpward />}
            />
          </Box>
        </Slide>
        <ViewportList
          ref={scrollRef}
          viewportRef={parentRef || noteRef}
          items={events}
          onViewportIndexesChange={onViewportIndexesChange}
          withCache
        >
          {(item) => (
            <ShortTextNoteCard key={item.deduplicationKey()} event={item} />
          )}
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
