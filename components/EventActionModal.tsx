'use client'
import ProfileChip from '@/components/ProfileChip'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
} from '@mui/material'
import { useCallback, useContext, useEffect } from 'react'
import {
  CloseOutlined,
  CommentOutlined,
  FormatQuoteOutlined,
  PlaceOutlined,
  RepeatOutlined,
} from '@mui/icons-material'
import { NostrContext } from '@/contexts/NostrContext'
import { AccountContext } from '@/contexts/AccountContext'
import { EventActionType, EventContext } from '@/contexts/EventContext'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { useForm } from 'react-hook-form'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import { NostrPrefix, createNostrLink, transformText } from '@snort/system'

const CreateEventForm = ({
  type,
  relatedEvents = [],
}: {
  type: EventActionType
  relatedEvents?: NDKEvent[]
}) => {
  const { ndk } = useContext(NostrContext)
  const { map } = useContext(MapContext)
  const { setEventAction } = useContext(EventContext)
  const { register, handleSubmit, setValue, watch } = useForm()
  const geohashValue = watch('geohash')
  useEffect(() => {
    if (!map) return
    const handleClickMap = ({ lngLat }: maplibregl.MapMouseEvent) => {
      setValue('geohash', Geohash.encode(lngLat.lat, lngLat.lng))
    }
    map.on('click', handleClickMap)
    return () => {
      map.off('click', handleClickMap)
    }
  }, [map, setValue])
  const handleClickClear = useCallback(
    (name: string) => () => {
      setValue(name, '')
    },
    [setValue],
  )
  const _handleSubmit = useCallback(
    async (data: any) => {
      const { content, geohash } = data
      const event = new NDKEvent(ndk)
      event.content = content
      event.tags = []
      switch (type) {
        case EventActionType.Create:
          event.kind = NDKKind.Text
          break
        case EventActionType.Repost:
          event.content = JSON.stringify(relatedEvents[0].rawEvent())
          event.kind = NDKKind.Repost
          break
        case EventActionType.Quote:
          event.kind = NDKKind.Text
          break
        case EventActionType.Comment:
          event.kind = NDKKind.Text
          break
      }
      if (type === EventActionType.Quote && relatedEvents.length > 0) {
        event.content = `${event.content}\n${relatedEvents
          .map(
            ({ id, relay }) =>
              `nostr:${createNostrLink(
                NostrPrefix.Event,
                id,
                relay ? [relay.url] : [],
              ).encode()}`,
          )
          .join('\n')}`
      }
      event.tags = event.tags.concat(
        relatedEvents.map(({ id, relay }) => [
          'e',
          id,
          ...(relay ? [relay.url] : []),
        ]),
        Array.from(
          new Set(
            transformText(content, [])
              .filter(({ type }) => type === 'hashtag')
              .map(({ content }) => content.toLowerCase()),
          ),
        ).map((item) => ['t', item]),
      )
      if (geohash) {
        const length = geohash.length
        for (let i = 1; i <= length; i++) {
          event.tags.push(['g', geohash.substring(0, i)])
        }
      }
      await event.publish()
      setEventAction(undefined)
    },
    [ndk, relatedEvents, setEventAction, type],
  )
  const renderActionTypeIcon = useCallback(() => {
    switch (type) {
      case EventActionType.Repost:
        return <RepeatOutlined />
      case EventActionType.Quote:
        return <FormatQuoteOutlined />
      case EventActionType.Comment:
        return <CommentOutlined />
      default:
        return undefined
    }
  }, [type])
  return (
    <form onSubmit={handleSubmit(_handleSubmit)}>
      <Box className="mt-3 grid gap-3 grid-cols-1">
        {type !== EventActionType.Repost && (
          <>
            <TextField
              placeholder="What's on your mind?"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              required
              {...register('content', { required: true })}
            />
            <TextField
              placeholder="Select location on the map."
              variant="outlined"
              fullWidth
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <PlaceOutlined />
                  </InputAdornment>
                ),
                endAdornment: geohashValue && (
                  <IconButton
                    size="small"
                    onClick={handleClickClear('geohash')}
                  >
                    <CloseOutlined />
                  </IconButton>
                ),
              }}
              {...register('geohash')}
            />
          </>
        )}
        {relatedEvents.map((item, index) => (
          <Box
            key={index}
            className="relative max-h-80 border-2 border-secondary-dark rounded-2xl overflow-hidden"
          >
            <ShortTextNoteCard event={item} hideAction />
            <Box className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-[#000000] to-50%" />
            <Box className="absolute right-0 bottom-0 border-t-2 border-l-2 border-secondary-dark p-2 rounded-tl-2xl text-contrast-secondary">
              {renderActionTypeIcon()}
            </Box>
          </Box>
        ))}
        <Box className="flex justify-end">
          <Button variant="contained" size="small" type="submit">
            {type === EventActionType.Repost ? 'Repost' : 'Post'}
          </Button>
        </Box>
      </Box>
    </form>
  )
}

const EventActionModal = () => {
  const { user } = useContext(AccountContext)
  const { eventAction, setEventAction } = useContext(EventContext)
  const handleClickCloseModal = useCallback(() => {
    setEventAction(undefined)
  }, [setEventAction])
  const renderAction = useCallback(() => {
    const { type, event } = eventAction || {}
    switch (type) {
      case EventActionType.Create:
      case EventActionType.Repost:
      case EventActionType.Quote:
      case EventActionType.Comment:
        return (
          <CreateEventForm
            type={type}
            relatedEvents={event ? [event] : undefined}
          />
        )
      default:
        return undefined
    }
  }, [eventAction])
  return (
    user && (
      <Box className="max-h-full flex rounded-2xl overflow-hidden p-0.5 background-gradient">
        <Paper className="w-full overflow-y-auto py-3 px-4 !rounded-2xl">
          <Box className="flex justify-between items-center">
            <ProfileChip user={user} />
            <IconButton size="small" onClick={handleClickCloseModal}>
              <CloseOutlined />
            </IconButton>
          </Box>
          <Box>{renderAction()}</Box>
        </Paper>
      </Box>
    )
  )
}

export default EventActionModal
