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
  Typography,
} from '@mui/material'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import {
  Close,
  Comment,
  ElectricBolt,
  FormatQuote,
  Place,
  Repeat,
} from '@mui/icons-material'
import { NostrContext } from '@/contexts/NostrContext'
import { AccountContext } from '@/contexts/AccountContext'
import { EventActionType, AppContext } from '@/contexts/AppContext'
import {
  NDKEvent,
  NDKKind,
  NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk'
import { useForm } from 'react-hook-form'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import {
  NostrPrefix,
  createNostrLink,
  transformText,
  tryParseNostrLink,
} from '@snort/system'
import numeral from 'numeral'
import { requestProvider } from 'webln'
import usePromise from 'react-use-promise'
import { nanoid } from 'nanoid'

const amountFormat = '0,0.[0]a'

const CreateEventForm = ({
  type,
  relatedEvents = [],
}: {
  type: EventActionType
  relatedEvents?: NDKEvent[]
}) => {
  const { ndk } = useContext(NostrContext)
  const { map } = useContext(MapContext)
  const { setEventAction } = useContext(AppContext)
  const { register, handleSubmit, setValue, watch } = useForm()
  const geohashValue = watch('geohash')
  useEffect(() => {
    if (!map) return
    const handleClickMap = ({ lngLat }: maplibregl.MapMouseEvent) => {
      setValue('geohash', Geohash.encode(lngLat.lat, lngLat.lng, 10))
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
      const newEvent = new NDKEvent(ndk)
      newEvent.content = content
      newEvent.tags = []

      // const ll = geohash ? Geohash.decode(geohash) : undefined
      // if (ll?.lat && ll?.lon) {
      //   const nid = nanoid(8)
      //   newEvent.content += `\nMap https://w3.do/${nid}`
      //   const w3 = new NDKEvent(ndk)
      //   w3.kind = 1994
      //   w3.tags = [
      //     ['d', nid],
      //     [
      //       'r',
      //       `https://duckduckgo.com/?va=n&t=hs&iaxm=maps&q=${ll.lat},${ll.lon}`,
      //     ],
      //   ]
      //   await w3.publish()
      // }

      switch (type) {
        case EventActionType.Create:
          newEvent.kind = NDKKind.Text
          break
        case EventActionType.Repost:
          newEvent.content = JSON.stringify(relatedEvents[0].rawEvent())
          newEvent.kind = NDKKind.Repost
          break
        case EventActionType.Quote:
          newEvent.kind = NDKKind.Text
          break
        case EventActionType.Comment:
          newEvent.kind = NDKKind.Text
          break
      }
      if (type === EventActionType.Quote && relatedEvents.length > 0) {
        newEvent.content = `${newEvent.content}\n${relatedEvents
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
      newEvent.tags = newEvent.tags.concat(
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
        for (let i = length - 1; i >= 0; i--) {
          newEvent.tags.push(['g', geohash.substring(0, i)])
        }
      }
      await newEvent.publish()
      setEventAction(undefined)
    },
    [ndk, relatedEvents, setEventAction, type],
  )
  const renderActionTypeIcon = useCallback(() => {
    switch (type) {
      case EventActionType.Repost:
        return <Repeat />
      case EventActionType.Quote:
        return <FormatQuote />
      case EventActionType.Comment:
        return <Comment />
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
                    <Place />
                  </InputAdornment>
                ),
                endAdornment: geohashValue && (
                  <IconButton
                    size="small"
                    onClick={handleClickClear('geohash')}
                  >
                    <Close />
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
            <ShortTextNoteCard
              event={item}
              action={false}
              relatedNoteVariant="link"
            />
            <Box className="absolute top-0 left-0 w-full h-full min-h-[320px] bg-gradient-to-t from-[#000000] to-50%" />
            <Box className="absolute right-0 bottom-0 border-t-2 border-l-2 border-secondary-dark p-2 rounded-tl-2xl text-contrast-secondary">
              {renderActionTypeIcon()}
            </Box>
          </Box>
        ))}
        <Box className="flex justify-end">
          <Button variant="contained" type="submit">
            {type === EventActionType.Repost ? 'Repost' : 'Post'}
          </Button>
        </Box>
      </Box>
    </form>
  )
}

const ZapEventForm = ({ event }: { event: NDKEvent }) => {
  const { setEventAction } = useContext(AppContext)
  const { register, handleSubmit, setValue, watch } = useForm()
  const _amountValue = watch('amount')
  const _handleSubmit = useCallback(
    async (data: any) => {
      const { amount, comment } = data
      const pr = await event.zap(amount * 1000, comment || undefined)
      if (pr) {
        await (await requestProvider()).sendPayment(pr)
        alert('Zapped')
        setEventAction(undefined)
      }
    },
    [event, setEventAction],
  )
  const amountValue = useMemo(
    () => (_amountValue ? numeral(_amountValue).format(amountFormat) : '?'),
    [_amountValue],
  )
  const amountOptions = useMemo(
    () => [
      50, 100, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000,
    ],
    [],
  )
  const handleClickAmount = useCallback(
    (amount: Number) => () => {
      setValue('amount', amount)
    },
    [setValue],
  )
  return (
    <form onSubmit={handleSubmit(_handleSubmit)}>
      <Box className="mt-3 grid gap-3 grid-cols-1">
        <Box className="relative max-h-80 border-2 border-secondary-dark rounded-2xl overflow-hidden">
          <ShortTextNoteCard
            event={event}
            action={false}
            relatedNoteVariant="link"
          />
          <Box className="absolute top-0 left-0 w-full h-full min-h-[320px] bg-gradient-to-t from-[#000000] to-50%" />
          <Box className="absolute right-0 bottom-0 border-t-2 border-l-2 border-secondary-dark p-2 rounded-tl-2xl text-primary">
            <ElectricBolt />
          </Box>
        </Box>
        <TextField
          placeholder="Comment"
          variant="outlined"
          fullWidth
          {...register('comment')}
        />
        <Box className="flex gap-2 flex-wrap justify-center">
          {amountOptions.map((amount, index) => (
            <Button
              key={index}
              color="secondary"
              variant="outlined"
              startIcon={<ElectricBolt className="!text-primary" />}
              onClick={handleClickAmount(amount)}
            >
              {numeral(amount).format(amountFormat)}
            </Button>
          ))}
        </Box>
        <TextField
          placeholder="Amount"
          variant="outlined"
          type="number"
          fullWidth
          required
          InputProps={{
            startAdornment: (
              <InputAdornment className="!text-primary" position="start">
                <ElectricBolt />
              </InputAdornment>
            ),
            endAdornment: <InputAdornment position="end">sats</InputAdornment>,
            inputProps: {
              min: 1,
            },
          }}
          {...register('amount', {
            required: true,
            valueAsNumber: true,
            min: 1,
          })}
        />
        <Box className="flex justify-end">
          <Button
            variant="contained"
            type="submit"
            startIcon={<ElectricBolt />}
          >
            {`Zap ${amountValue} sats`}
          </Button>
        </Box>
      </Box>
    </form>
  )
}

const ShortTextNotePane = ({
  event,
  reposts = false,
  quotes = false,
  comments = false,
}: {
  event: NDKEvent
  reposts: boolean
  quotes: boolean
  comments: boolean
}) => {
  const { ndk, relaySet } = useContext(NostrContext)
  const [relatedEvents] = usePromise(async () => {
    if (relaySet && ndk && event) {
      const [repostEvents, quoteAndCommentEvents] = await Promise.all([
        reposts
          ? Array.from(
              await ndk.fetchEvents(
                {
                  kinds: [NDKKind.Repost],
                  '#e': [event.id],
                },
                { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
                relaySet,
              ),
            )
          : [],
        quotes || comments
          ? Array.from(
              await ndk.fetchEvents(
                {
                  kinds: [NDKKind.Text],
                  '#e': [event.id],
                },
                { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
                relaySet,
              ),
            )
          : [],
      ])
      const _quotes: NDKEvent[] = []
      const _comments: NDKEvent[] = []
      quoteAndCommentEvents.forEach((item) => {
        const { content, tags } = item
        const linkFound =
          transformText(content, tags).filter(
            ({ type, content }) =>
              type === 'link' &&
              content.startsWith('nostr:nevent1') &&
              tryParseNostrLink(content)?.id === event.id,
          ).length > 0
        if (quotes && linkFound) {
          _quotes.push(item)
        } else if (comments && !linkFound) {
          _comments.push(item)
        }
      })
      return [...repostEvents, ..._quotes, ..._comments]
    }
  }, [relaySet, ndk, event, reposts, quotes, comments])
  const relatedEventElements = useMemo(
    () =>
      relatedEvents?.map((item) => (
        <ShortTextNoteCard key={item.id} event={item} />
      )),
    [relatedEvents],
  )
  return (
    <Box>
      <ShortTextNoteCard event={event} />
      <Box className="ml-4 border-l border-[rgba(255,255,255,0.12)]">
        {relatedEventElements}
      </Box>
    </Box>
  )
}

const EventActionModal = () => {
  const { user } = useContext(AccountContext)
  const { eventAction, setEventAction } = useContext(AppContext)
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
      case EventActionType.Zap:
        return event && <ZapEventForm event={event} />
      case EventActionType.View:
        return (
          event && (
            <ShortTextNotePane
              event={event}
              {...(eventAction?.options || {})}
            />
          )
        )
      default:
        return undefined
    }
  }, [eventAction])
  const title = useMemo(() => {
    if (eventAction?.type === EventActionType.View) {
      if (
        [
          eventAction.options?.reposts,
          eventAction.options?.quotes,
          eventAction.options?.comments,
        ].filter((item) => !!item).length === 1
      ) {
        if (eventAction.options?.reposts) {
          return (
            <>
              <Repeat className="mr-2" />
              Reposts
            </>
          )
        } else if (eventAction.options?.quotes) {
          return (
            <>
              <FormatQuote className="mr-2" />
              Quotes
            </>
          )
        } else if (eventAction.options?.comments) {
          return (
            <>
              <Comment className="mr-2" />
              Comments
            </>
          )
        }
      } else {
        return [
          eventAction.options?.reposts && 'Reposts',
          eventAction.options?.quotes && 'Quotes',
          eventAction.options?.comments && 'Comments',
        ]
          .filter((item) => !!item)
          .join(', ')
      }
    }
  }, [eventAction])
  return (
    eventAction && (
      <Box className="max-h-full flex rounded-2xl overflow-hidden p-0.5 background-gradient">
        <IconButton
          className="!absolute top-12 right-12 z-10 !bg-[#0000001f]"
          size="small"
          onClick={handleClickCloseModal}
        >
          <Close />
        </IconButton>
        <Paper className="w-full overflow-y-auto pt-3 !rounded-2xl">
          <Box className="flex justify-between items-center px-4">
            {eventAction.type === EventActionType.View ? (
              <Typography variant="body1">{title}</Typography>
            ) : (
              <ProfileChip user={user} />
            )}
          </Box>
          <Box
            className={
              eventAction.type !== EventActionType.View
                ? 'pb-3 px-4'
                : undefined
            }
          >
            {renderAction()}
          </Box>
        </Paper>
      </Box>
    )
  )
}

export default EventActionModal
