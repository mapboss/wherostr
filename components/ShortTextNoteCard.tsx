'use client'
import NoteActionBar from '@/components/NoteActionBar'
import ProfileChip from '@/components/ProfileChip'
import TextNote from '@/components/TextNote'
import TimeFromNow from '@/components/TimeFromNow'
import {
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  Typography,
} from '@mui/material'
import { useCallback, useContext, useMemo } from 'react'
import {
  ArrowRightAlt,
  MapOutlined,
  MoreVert,
  Repeat,
  TravelExploreOutlined,
  ZoomInMap,
} from '@mui/icons-material'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import { EventExt } from '@snort/system'
import { EventActionType, AppContext } from '@/contexts/AppContext'
import { useUserCache } from '@/hooks/useCache'
import { extractLngLat } from '@/utils/extractLngLat'
import { MapContext } from '@/contexts/MapContext'
import { LngLatBounds } from 'maplibre-gl'

const ShortTextNoteCard = ({
  event,
  action = true,
  relatedNoteVariant = 'fraction',
}: {
  event: NDKEvent
  action?: boolean
  relatedNoteVariant?: 'full' | 'fraction' | 'link'
}) => {
  const { ndk, getEvent } = useContext(NostrContext)
  const { map } = useContext(MapContext)
  const [user, error, state] = useUserCache(event.pubkey)
  const createdDate = useMemo(
    () => (event.created_at ? new Date(event.created_at * 1000) : undefined),
    [event],
  )
  const fromNote = useMemo(() => {
    if (event) {
      const thread = EventExt.extractThread(event as any)
      return thread?.root || thread?.replyTo
    }
  }, [event])
  const { setEventAction } = useContext(AppContext)
  const handleClickRootNote = useCallback(async () => {
    if (ndk && fromNote?.value) {
      const rootEvent = await getEvent(fromNote.value)
      if (rootEvent) {
        setEventAction({
          type: EventActionType.View,
          event: rootEvent,
          options: {
            quotes: true,
            comments: true,
          },
        })
      }
    }
  }, [ndk, fromNote, getEvent, setEventAction])

  const lnglat = useMemo(() => extractLngLat(event), [event])

  return (
    <Card className="!rounded-none">
      <Box className="px-4 pt-3 flex items-center gap-2 text-contrast-secondary">
        <ProfileChip user={user} />
        {createdDate && (
          <Box className="grow flex flex-col items-end shrink-0">
            <Typography variant="caption">
              <TimeFromNow date={createdDate} />
            </Typography>
            {fromNote && (
              <Typography
                className="cursor-pointer"
                variant="caption"
                color="secondary"
                onClick={handleClickRootNote}
              >
                {event.kind === 6 ? (
                  <Repeat className="mr-1" fontSize="small" />
                ) : (
                  <ArrowRightAlt className="mr-1" fontSize="small" />
                )}
                from a note
              </Typography>
            )}
          </Box>
        )}
        {action && lnglat ? (
          <IconButton
            size="small"
            onClick={() => {
              map?.fitBounds(LngLatBounds.fromLngLat(lnglat), {
                maxZoom: 15,
                duration: 300,
              })
            }}
          >
            {/* <MoreVert /> */}
            <TravelExploreOutlined className="text-contrast-secondary" />
          </IconButton>
        ) : null}
      </Box>
      {event.kind === NDKKind.Text && (
        <Box className="flex">
          <CardContent className="flex-1 !pt-3 !pb-0 overflow-hidden">
            <TextNote event={event} relatedNoteVariant={relatedNoteVariant} />
            {action && (
              <Box className="mt-2">
                <NoteActionBar event={event} />
              </Box>
            )}
          </CardContent>
        </Box>
      )}
      <Divider className="!mt-3" />
    </Card>
  )
}

export default ShortTextNoteCard
