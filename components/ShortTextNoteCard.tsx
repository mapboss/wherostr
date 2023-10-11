'use client'
import NoteActionBar from '@/components/NoteActionBar'
import ProfileChip from '@/components/ProfileChip'
import TextNote, { QuotedEvent } from '@/components/TextNote'
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
  Repeat,
  TravelExploreOutlined,
} from '@mui/icons-material'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import { EventExt } from '@snort/system'
import { EventActionType, AppContext } from '@/contexts/AppContext'
import { extractLngLat } from '@/utils/extractLngLat'
import { MapContext } from '@/contexts/MapContext'
import { LngLatBounds } from 'maplibre-gl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useUserProfile } from '@/hooks/useUserProfile'

const ShortTextNoteCard = ({
  event,
  action = true,
  relatedNoteVariant = 'fraction',
}: {
  event: NDKEvent
  action?: boolean
  relatedNoteVariant?: 'full' | 'fraction' | 'link'
}) => {
  const pathname = usePathname()
  const query = useSearchParams()
  const router = useRouter()
  const { ndk, getEvent } = useContext(NostrContext)
  const { map } = useContext(MapContext)
  const user = useUserProfile(event.pubkey)
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
            comments: true,
          },
        })
      }
    }
  }, [ndk, fromNote, getEvent, setEventAction])

  const lnglat = useMemo(() => extractLngLat(event), [event])
  const repostId = useMemo(() => event.tagValue('e'), [event])

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
              const keyword = query.get('keyword') || ''
              router.replace(`${pathname}?keyword=${keyword}&map=1`)
              setTimeout(() => {
                map?.fitBounds(LngLatBounds.fromLngLat(lnglat), {
                  animate: false,
                  maxZoom: 15,
                })
              }, 300)
            }}
          >
            {/* <MoreVert /> */}
            <TravelExploreOutlined className="text-contrast-secondary" />
          </IconButton>
        ) : null}
      </Box>
      {event.kind === NDKKind.Text ? (
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
      ) : event.kind === NDKKind.Repost && repostId ? (
        <Box className="flex">
          <CardContent className="flex-1 !pt-3 !pb-0 overflow-hidden">
            <QuotedEvent
              id={repostId}
              relatedNoteVariant={relatedNoteVariant}
            />
          </CardContent>
        </Box>
      ) : null}
      <Divider className="!mt-3" />
    </Card>
  )
}

export default ShortTextNoteCard
