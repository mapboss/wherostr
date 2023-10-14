'use client'
import ProfileChip from '@/components/ProfileChip'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  ToggleButton,
  Typography,
} from '@mui/material'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Close,
  Comment,
  ElectricBolt,
  FormatQuote,
  LocationOff,
  Place,
  Repeat,
} from '@mui/icons-material'
import { NostrContext } from '@/contexts/NostrContext'
import { AccountContext } from '@/contexts/AccountContext'
import { EventActionType, AppContext } from '@/contexts/AppContext'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { useForm } from 'react-hook-form'
import { MapContext } from '@/contexts/MapContext'
import Geohash from 'latlon-geohash'
import {
  NostrPrefix,
  createNostrLink,
  tryParseNostrLink,
  transformText,
} from '@snort/system'
import numeral from 'numeral'
import { requestProvider } from 'webln'
import TextNote from './TextNote'
import { useEvents } from '@/hooks/useEvent'
import {
  PostingOptions,
  PostingOptionsProps,
  PostingOptionsValues,
} from './PostingOptions'
import { useDropzone } from 'react-dropzone'
import { upload } from '@/utils/upload'
import { shortenUrl } from '@/utils/shortenUrl'
import { LoadingButton } from '@mui/lab'

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
  const [busy, setBusy] = useState(false)
  const [positingOptions, setPostingOptions] = useState<PostingOptionsValues>()
  const geohashValue = watch('geohash', '')
  const contentValue = watch('content', '')
  const enableLocation = useRef<boolean | undefined>(positingOptions?.location)
  enableLocation.current = positingOptions?.location

  useEffect(() => {
    if (!map) return
    const handleClickMap = ({ lngLat }: maplibregl.MapMouseEvent) => {
      if (!enableLocation.current) return
      setValue('geohash', Geohash.encode(lngLat.lat, lngLat.lng, 9))
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

  const previewGeohashUrl = useMemo(() => {
    if (!positingOptions?.location || !geohashValue) return ''
    const ll = Geohash.decode(geohashValue)
    if (ll?.lat && ll?.lon) {
      const duckduck = shortenUrl(
        `https://duckduckgo.com/?va=n&t=hs&iaxm=maps&q=${ll.lat},${ll.lon}`,
        ndk,
      )
      const google = shortenUrl(
        `https://www.google.com/maps/place/${ll.lat},${ll.lon}`,
        ndk,
      )
      let content = `\n---`
      content += `\nDuck Duck Go Maps | ${duckduck.url}`
      content += `\nGoogle Maps | ${google.url}`
      content += `\nWherostr Map | https://wherostr.social/m/?q=${geohashValue}`
      return content
    }
  }, [ndk, geohashValue, positingOptions?.location])

  const _handleSubmit = useCallback(
    async (data: any) => {
      setBusy(true)
      const { content, geohash } = data
      const newEvent = new NDKEvent(ndk)
      newEvent.content = content
      newEvent.tags = []
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

      /**
       * TODO: Create short link
       */
      const ll = geohash ? Geohash.decode(geohash) : undefined
      if (ll?.lat && ll?.lon) {
        const duckduck = shortenUrl(
          `https://duckduckgo.com/?va=n&t=hs&iaxm=maps&q=${ll.lat},${ll.lon}`,
          ndk,
        )
        const google = shortenUrl(
          `https://www.google.com/maps/place/${ll.lat},${ll.lon}`,
          ndk,
        )
        newEvent.content += `\n---`
        newEvent.content += `\nDuck Duck Go Maps | ${duckduck.url}`
        newEvent.content += `\nGoogle Maps | ${google.url}`
        newEvent.content += `\nWherostr Map | https://wherostr.social/m/?q=${geohash}`

        await Promise.all([duckduck.event.publish(), google.event.publish()])
      }

      await newEvent.publish()
      setBusy(false)
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

  const previewEvent = useMemo(() => {
    return {
      content: contentValue + previewGeohashUrl,
      tags: [],
    } as unknown as NDKEvent
  }, [contentValue, previewGeohashUrl])

  const handleUploadFile = useCallback((acceptedFiles: File[]) => {
    console.log('onDrop', acceptedFiles)
    setBusy(true)
    /**
     * TODO: Upload Image
     */
    // https://api.imgur.com/3/image
    // Method: POST
    // Authorization: Client-ID e4f58fc81daec99
    // upload(acceptedFiles[0]).then(console.log)
    setBusy(false)
  }, [])

  const dropzoneOptions = useMemo(
    () => ({
      noClick: true,
      noKeyboard: true,
      accept: { 'image/*': [] },
      onDrop: handleUploadFile,
    }),
    [handleUploadFile],
  )
  const { getRootProps } = useDropzone(dropzoneOptions)

  const handlePostingOptionsChange = useCallback<
    NonNullable<PostingOptionsProps['onChange']>
  >(
    (name, values) => {
      if (name === 'image') {
        values.image && handleUploadFile(values.image)
      } else {
        setPostingOptions(values)
      }
    },
    [handleUploadFile],
  )

  return (
    <form
      onSubmit={handleSubmit(_handleSubmit)}
      {...getRootProps({ className: 'dropzone' })}
    >
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
            {positingOptions?.location === true && (
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
            )}
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
        {previewEvent?.content && (
          <>
            <Typography color="text.secondary" className="pl-2">
              Preview:
            </Typography>
            <Box className="rounded-2xl border border-[rgba(255,255,255,0.2)] p-2 pointer-events-none">
              <TextNote event={previewEvent} relatedNoteVariant="full" />
            </Box>
          </>
        )}
        <Box className="flex">
          <PostingOptions onChange={handlePostingOptionsChange} />
          <Box flex={1} />
          <LoadingButton
            loading={busy}
            loadingPosition="start"
            variant="contained"
            type="submit"
          >
            {type === EventActionType.Repost ? 'Repost' : 'Post'}
          </LoadingButton>
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
  const filter = useMemo(() => {
    const kinds: NDKKind[] = []
    if (comments || quotes) {
      kinds.push(NDKKind.Text)
    }
    if (reposts) {
      kinds.push(NDKKind.Repost)
    }
    return { kinds, '#e': [event.id] }
  }, [event.id, reposts, quotes, comments])

  const [relatedEvents, error, state] = useEvents(filter)

  const relatedEventElements = useMemo(() => {
    if (!relatedEvents) return
    const repostEvents: NDKEvent[] = []
    const _quotes: NDKEvent[] = []
    const _comments: NDKEvent[] = []
    relatedEvents.forEach((item) => {
      const { content, tags, kind } = item
      if (kind === NDKKind.Repost) {
        repostEvents.push(item)
      } else {
        const linkFound =
          transformText(content, tags).filter(
            ({ type, content }) =>
              type === 'link' &&
              (content.startsWith('nostr:nevent1') ||
                content.startsWith('nostr:note1')) &&
              tryParseNostrLink(content)?.id === event.id,
          ).length > 0
        if (quotes && linkFound) {
          _quotes.push(item)
        } else if (comments && !linkFound) {
          _comments.push(item)
        }
      }
    })
    return [...repostEvents, ..._quotes, ..._comments].map((item) => (
      <ShortTextNoteCard key={item.id} event={item} />
    ))
  }, [comments, event.id, quotes, relatedEvents])

  return (
    <Box>
      <ShortTextNoteCard event={event} />
      <Box className="ml-4 border-l border-[rgba(255,255,255,0.12)]">
        {relatedEventElements ? (
          relatedEventElements
        ) : (
          <Box p={1} textAlign="center">
            <CircularProgress color="inherit" />
          </Box>
        )}
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
      <Box className="relative max-h-full flex rounded-2xl overflow-hidden p-0.5 background-gradient">
        <IconButton
          className="!absolute top-4 right-4 z-10 !bg-[#0000001f]"
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
              <ProfileChip hexpubkey={user?.hexpubkey} />
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
