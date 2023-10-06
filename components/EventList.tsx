'use client'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import {
  FC,
  ForwardRefRenderFunction,
  ForwardedRef,
  RefObject,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import { Box, LinearProgress, Slide, Typography } from '@mui/material'
import { ViewportList } from 'react-viewport-list'

export interface EventListProps {
  events?: NDKEvent[]
  onNeedFetch?: () => Promise<NDKEvent[] | undefined>
  parentRef?: RefObject<HTMLElement> | null
}

const EventList: FC<EventListProps> = ({
  events = [],
  parentRef = null,
  onNeedFetch,
}) => {
  const noteRef = useRef<HTMLElement>(null)
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
      const items = await onNeedFetch?.()
      setFetching(false)
      setHasNext(!!items?.length)
    },
    [hasNext, fetching, totalEvent, onNeedFetch],
  )

  return (
    <>
      <Box ref={!parentRef ? noteRef : undefined} className="overflow-y-auto">
        <ViewportList
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
