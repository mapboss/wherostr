import { EventActionType } from '@/contexts/AppContext'
import { useAction } from '@/hooks/useApp'
import { useMap } from '@/hooks/useMap'
import { useNDK } from '@/hooks/useNostr'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  PostingOptions,
  PostingOptionsProps,
  PostingOptionsValues,
} from './PostingOptions'
import Geohash from 'latlon-geohash'
import { shortenUrl } from '@/utils/shortenUrl'
import { NostrPrefix, createNostrLink, transformText } from '@snort/system'
import {
  AddLocationAlt,
  Close,
  Comment,
  Draw,
  FormatQuote,
  ImageSearch,
  MyLocation,
  Place,
  Repeat,
} from '@mui/icons-material'
import { FileRejection, useDropzone } from 'react-dropzone'
import { accept, upload } from '@/utils/upload'
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ShortTextNoteCard from './ShortTextNoteCard'
import TextNote from './TextNote'
import { LoadingButton } from '@mui/lab'
import { LngLat, LngLatBounds } from 'maplibre-gl'

export const CreateEventForm = ({
  type,
  relatedEvents = [],
}: {
  type: EventActionType
  relatedEvents?: NDKEvent[]
}) => {
  const ndk = useNDK()
  const map = useMap()
  const { setEventAction, showSnackbar } = useAction()
  const { register, handleSubmit, setValue, watch } = useForm()
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [positingOptions, setPostingOptions] = useState<PostingOptionsValues>()
  const geohashValue = watch('geohash', '')
  const contentValue = watch('content', '')
  const inputRef = useRef<HTMLTextAreaElement>(null)
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
      content += `\nWherostr Map | https://wherostr.social/m/?q=${geohashValue}`
      content += `\nGoogle Maps | ${google.url}`
      return content
    }
  }, [ndk, geohashValue, positingOptions?.location])

  const _handleSubmit = useCallback(
    async (data: any) => {
      try {
        setPosting(true)
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
        if (positingOptions?.location && geohash) {
          const length = geohash.length
          for (let i = length - 1; i >= 0; i--) {
            newEvent.tags.push(['g', geohash.substring(0, i)])
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
            newEvent.content += `\nWherostr Map | https://wherostr.social/m/?q=${geohash}`
            newEvent.content += `\nDuck Duck Go Maps | ${duckduck.url}`
            newEvent.content += `\nGoogle Maps | ${google.url}`

            await Promise.all([
              duckduck.event.publish(),
              google.event.publish(),
            ])
          }
        }

        await newEvent.publish()
        setEventAction(undefined)
      } catch (err) {
      } finally {
        setPosting(false)
      }
    },
    [ndk, positingOptions?.location, relatedEvents, setEventAction, type],
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

  const handleUploadFile = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      try {
        if (fileRejections.length > 0) {
          return showSnackbar(
            'File type must be ' +
              Object.values(accept)
                .map((d) => d.join(', '))
                .join(', '),
            // { slotProps: { alert: { severity: 'error' } } },
          )
        }
        const selectionStart = inputRef.current?.selectionStart

        setUploading(true)
        const data = await upload(acceptedFiles).then((res) => res.data)
        const urls = data.map((d) => d.url).join('\n')
        setValue(
          'content',
          contentValue
            ? `${contentValue.substring(
                0,
                selectionStart,
              )}\n${urls}${contentValue.substring(selectionStart)}`
            : `${contentValue}${urls}`,
        )
      } catch (err) {
      } finally {
        setUploading(false)
      }
    },
    [contentValue, setValue, showSnackbar],
  )

  const dropzoneOptions = useMemo(
    () => ({
      noClick: true,
      noKeyboard: true,
      accept: accept,
      onDrop: handleUploadFile,
    }),
    [handleUploadFile],
  )
  const { getRootProps } = useDropzone(dropzoneOptions)

  const handlePostingOptionsChange = useCallback<
    NonNullable<PostingOptionsProps['onChange']>
  >((name, values) => {
    setPostingOptions(values)
  }, [])

  const disabled = useMemo(
    () => uploading || busy || posting || locating,
    [uploading, busy, posting, locating],
  )

  const ll = useMemo(() => {
    return geohashValue ? Geohash.decode(geohashValue) : undefined
  }, [geohashValue])

  return (
    <form
      onSubmit={handleSubmit(_handleSubmit)}
      {...getRootProps({
        className: 'dropzone',
        onDragOver: (e) => {
          e.dataTransfer.dropEffect = 'copy'
        },
      })}
    >
      <Box className="mt-3 grid gap-3 grid-cols-1">
        {type !== EventActionType.Repost && (
          <>
            <TextField
              inputRef={inputRef}
              placeholder="What's on your mind?"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              required
              disabled={disabled}
              InputProps={{
                endAdornment: uploading && (
                  <InputAdornment position="end">
                    <CircularProgress
                      size={24}
                      color="inherit"
                      className="absolute bottom-2 right-4"
                    />
                  </InputAdornment>
                ),
              }}
              {...register('content', { required: true })}
            />
            {positingOptions?.location === true && (
              <>
                <input {...register('geohash')} type="hidden" />
                <TextField
                  label={!geohashValue ? 'Please select an option' : 'Location'}
                  variant="outlined"
                  fullWidth
                  inputProps={
                    geohashValue ? { style: { display: 'none' } } : undefined
                  }
                  InputProps={{
                    readOnly: true,
                    startAdornment: geohashValue ? (
                      <ListItem dense disableGutters>
                        <ListItemIcon>
                          <Place />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${ll?.lat}, ${ll?.lon}`}
                          secondary={`Geohash: ${geohashValue}`}
                        />
                      </ListItem>
                    ) : (
                      <Stack direction="row" spacing={0.5}>
                        <Chip
                          label="GPS"
                          icon={<MyLocation />}
                          onClick={async () => {
                            setLocating(true)
                            await new Promise((resolve, reject) => {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  console.log('geolocation:success')
                                  const bounds = LngLatBounds.fromLngLat(
                                    new LngLat(
                                      position.coords.longitude,
                                      position.coords.latitude,
                                    ),
                                  )
                                  map?.fitBounds(bounds, { maxZoom: 14 })
                                  const geo = Geohash.encode(
                                    position.coords.latitude,
                                    position.coords.longitude,
                                    9,
                                  )
                                  setValue('geohash', geo)
                                  resolve(geo)
                                },
                                (err) => {
                                  console.log('geolocation:error', err)
                                },
                              )
                            })
                            setLocating(false)
                          }}
                        />
                        <Chip
                          label="Image"
                          icon={<ImageSearch />}
                          onClick={() => {}}
                        />
                        <Chip
                          label="Mark on map"
                          icon={<AddLocationAlt />}
                          onClick={() => {}}
                        />
                      </Stack>
                    ),
                    endAdornment: geohashValue ? (
                      <IconButton
                        size="small"
                        onClick={handleClickClear('geohash')}
                      >
                        <Close />
                      </IconButton>
                    ) : undefined,
                  }}
                  disabled={disabled}
                />
              </>
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
          <PostingOptions
            disabled={disabled}
            onChange={handlePostingOptionsChange}
            slotProps={{
              dropzone: { onDrop: dropzoneOptions.onDrop },
            }}
          />
          <Box flex={1} />
          <LoadingButton
            disabled={disabled}
            loading={posting}
            loadingPosition="start"
            variant="contained"
            type="submit"
            startIcon={type === EventActionType.Repost ? <Repeat /> : <Draw />}
          >
            {type === EventActionType.Repost ? 'Repost' : 'Post'}
          </LoadingButton>
        </Box>
      </Box>
    </form>
  )
}
