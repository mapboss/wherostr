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
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useContext, useMemo } from 'react'
import {
  ArrowRightAlt,
  ChevronRightOutlined,
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
import NoteMenu from './NoteMenu'

const ShortTextNoteCard = ({
  event,
  action = true,
  relatedNoteVariant = 'fraction',
  depth = 0,
  hideContent = false,
  indent = true,
  indentLine,
  viewNoteButton = true,
}: {
  event: NDKEvent
  action?: boolean
  relatedNoteVariant?: 'full' | 'fraction' | 'link'
  depth?: number
  hideContent?: boolean
  indent?: boolean
  indentLine?: boolean
  viewNoteButton?: boolean
}) => {
  const pathname = usePathname()
  const query = useSearchParams()
  const router = useRouter()
  const { ndk, getEvent } = useContext(NostrContext)
  const { map } = useContext(MapContext)
  const createdDate = useMemo(
    () => (event.created_at ? new Date(event.created_at * 1000) : undefined),
    [event],
  )
  const fromNote = useMemo(() => {
    if (event && depth === 0) {
      const thread = EventExt.extractThread(event as any)
      return thread?.root || thread?.replyTo
    }
  }, [event, depth])
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
  const repostId = useMemo(
    () => (event.kind === NDKKind.Repost ? event.tagValue('e') : undefined),
    [event],
  )
  const hexpubkey = useMemo(() => {
    if (event.kind === 30311) {
      let hostPubkey
      const pTags = event.getMatchingTags('p')
      if (pTags.length) {
        hostPubkey = pTags[0][1]
        for (const item of pTags) {
          if (item[3]?.toLowerCase() === 'host') {
            hostPubkey = item[1]
            break
          }
        }
      }
      return hostPubkey || event.pubkey
    } else {
      return event.pubkey
    }
  }, [event])
  const handleClickViewNote = useCallback(() => {
    setEventAction({
      type: EventActionType.View,
      event,
      options: { comments: true },
    })
  }, [event, setEventAction])

  const difficulty = useMemo(() => {
    return event.getMatchingTags('nonce').at(0)?.[2]
  }, [event, setEventAction])

  return (
    <Card className="!rounded-none">
      <Box className="px-3 pt-3 flex items-center gap-2 text-contrast-secondary">
        <ProfileChip hexpubkey={hexpubkey} />
        {createdDate && (
          <Box className="grow flex flex-col items-end shrink-0">
            <Typography variant="caption">
              {difficulty && (
                <>
                  <Tooltip title={event.id}>
                    <Typography variant="caption" fontWeight="bold">
                      PoW-{difficulty}
                    </Typography>
                  </Tooltip>
                  <Box component="span" className="mx-1" />
                </>
              )}
              <TimeFromNow date={createdDate} />
            </Typography>
            {depth === 0 && fromNote && (
              <Typography
                className="cursor-pointer"
                variant="caption"
                color="secondary"
                onClick={handleClickRootNote}
              >
                {event.kind === 6 ? (
                  <>
                    <Repeat className="mr-1" fontSize="small" />
                    reposted note
                  </>
                ) : (
                  <>
                    <ArrowRightAlt className="mr-1" fontSize="small" />
                    commented note
                  </>
                )}
              </Typography>
            )}
          </Box>
        )}
        {action && (
          <>
            {!!lnglat && (
              <IconButton
                size="small"
                onClick={() => {
                  setTimeout(() => {
                    map?.fitBounds(LngLatBounds.fromLngLat(lnglat), {
                      animate: false,
                      maxZoom: 15,
                    })
                  }, 300)
                  const q = query.get('q') || ''
                  router.replace(`${pathname}?q=${q}&map=1`, { scroll: false })
                }}
              >
                <TravelExploreOutlined className="text-contrast-secondary" />
              </IconButton>
            )}
            <NoteMenu event={event} />
            {viewNoteButton && (
              <IconButton size="small" onClick={handleClickViewNote}>
                <ChevronRightOutlined className="text-contrast-secondary" />
              </IconButton>
            )}
          </>
        )}
      </Box>
      {!hideContent && (
        <Box className="flex min-h-[12px]">
          <Box className={`flex justify-center ${indent ? 'w-16' : 'w-3'}`}>
            {indentLine && (
              <Box className="h-full w-[2px] bg-[rgba(255,255,255,0.12)]" />
            )}
          </Box>
          {event.kind === NDKKind.Text ? (
            <CardContent className="flex-1 !pl-0 !pr-3 !pt-3 !pb-0 overflow-hidden">
              <TextNote event={event} relatedNoteVariant={relatedNoteVariant} />
              {action && (
                <Box className="mt-3">
                  <NoteActionBar event={event} />
                </Box>
              )}
            </CardContent>
          ) : (
            repostId && (
              <CardContent className="flex-1 !pl-0 !pr-3 !py-0 overflow-hidden">
                <QuotedEvent
                  id={repostId}
                  relatedNoteVariant={relatedNoteVariant}
                  icon={<Repeat />}
                />
              </CardContent>
            )
          )}
        </Box>
      )}
      <Divider className="!mt-3" />
    </Card>
  )
}

export default ShortTextNoteCard
