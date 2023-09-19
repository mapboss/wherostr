'use client'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { useRef } from 'react'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import { Box } from '@mui/material'
import { ViewportList } from 'react-viewport-list'

const EventList = ({ events = [] }: { events: NDKEvent[] }) => {
  const ref = useRef(null)
  return (
    <Box ref={ref} className="overflow-y-auto">
      <ViewportList viewportRef={ref} items={events}>
        {(item) => <ShortTextNoteCard key={item.id} event={item} />}
      </ViewportList>
    </Box>
  )
}

export default EventList
