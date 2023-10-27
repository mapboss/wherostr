import { EventActionType } from '@/contexts/AppContext'
import { useAction } from '@/hooks/useApp'
import { useMap } from '@/hooks/useMap'
import { useNDK, useRelaySet } from '@/hooks/useNostr'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  PostingOptions,
  PostingOptionsProps,
  PostingOptionsValues,
} from './PostingOptions'
import Geohash from 'latlon-geohash'
import { shortenUrl } from '@/utils/shortenUrl'
import {
  EventBuilder,
  EventKind,
  NostrPrefix,
  PowWorker,
  createNostrLink,
} from '@snort/system'
import {
  Close,
  Comment,
  Draw,
  FormatQuote,
  Link,
  LinkOff,
  Map,
  MyLocation,
  Place,
  Repeat,
} from '@mui/icons-material'
import { FileRejection, useDropzone } from 'react-dropzone'
import { accept, upload } from '@/utils/upload'
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ShortTextNoteCard from './ShortTextNoteCard'
import TextNote from './TextNote'
import { LoadingButton } from '@mui/lab'
import { reverse } from '@/services/osm'
import usePromise from 'react-use-promise'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useAccount'

const powWorker =
  typeof window !== 'undefined' ? new PowWorker('/pow.js') : undefined

export const CreateEventForm = ({
  type,
  relatedEvents = [],
}: {
  type: EventActionType
  relatedEvents?: NDKEvent[]
}) => {
  const ndk = useNDK()
  const map = useMap()
  const user = useUser()
  const relaySet = useRelaySet()
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const query = useSearchParams()
  const { setEventAction, showSnackbar } = useAction()
  const { register, handleSubmit, setValue, watch } = useForm()
  const [busy, setBusy] = useState(false)
  const [appendMapLink, setAppendMapLink] = useState(false)
  const [locating, setLocating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [positingOptions, setPostingOptions] = useState<PostingOptionsValues>()
  const nostrLink = useMemo(() => {
    if (type !== EventActionType.Quote) return ''
    if (!relatedEvents[0]?.id) return ''
    let link
    if (relatedEvents?.[0].kind === 30311) {
      const dTag = relatedEvents?.[0].tagValue('d')
      if (dTag) {
        link = createNostrLink(
          NostrPrefix.Address,
          dTag,
          relatedEvents?.[0]?.relay ? [relatedEvents[0].relay.url] : undefined,
          relatedEvents?.[0].kind,
          relatedEvents?.[0].pubkey,
        ).encode()
      }
    } else {
      link = createNostrLink(
        NostrPrefix.Event,
        relatedEvents?.[0].id,
        relatedEvents?.[0]?.relay ? [relatedEvents[0].relay.url] : undefined,
        relatedEvents?.[0].kind,
        relatedEvents?.[0].pubkey,
      ).encode()
    }
    return link ? `nostr:${link}` : ''
  }, [type, relatedEvents])

  const geohashValue = watch('geohash', '')
  const contentValue = watch('content', nostrLink)
  const mdDown = useMediaQuery(theme.breakpoints.down('md'))
  const mdDownRef = useRef<boolean>(mdDown)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const enableLocation = useRef<boolean | undefined>(positingOptions?.location)
  const powRef = useRef(powWorker)
  powRef.current = powWorker
  enableLocation.current = positingOptions?.location
  mdDownRef.current = mdDown

  const q = query.get('q')
  // const mentions = getContentMentions(correctContentMentions(contentValue))
  // console.log('mentions', mentions)

  const handleShowMap = (show: boolean) => {
    let querystring = []
    querystring.push('q=' + (q || ''))
    if (show) {
      querystring.push('map=1')
    }
    router.replace(`${pathname}?${querystring.join('&')}`)
  }

  useEffect(() => {
    if (!map) return
    const handleClickMap = ({ lngLat }: maplibregl.MapMouseEvent) => {
      if (!enableLocation.current) return
      setValue('geohash', Geohash.encode(lngLat.lat, lngLat.lng, 10))
      handleShowMap(false)
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
    if (!appendMapLink || !positingOptions?.location || !geohashValue) return ''
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
  }, [ndk, geohashValue, positingOptions?.location, appendMapLink])

  const _handleSubmit = useCallback(
    async (data: any) => {
      try {
        setPosting(true)
        const { content, geohash } = data
        const newEvent = new EventBuilder()
        let noteContent = content
        newEvent.pubKey(user!.hexpubkey)
        // const newEvent = new NDKEvent(ndk)
        // newEvent.content = content
        // newEvent.tags = []
        switch (type) {
          case EventActionType.Create:
            newEvent.kind(EventKind.TextNote)
            break
          case EventActionType.Repost:
            noteContent = JSON.stringify(relatedEvents[0].rawEvent())
            newEvent.kind(EventKind.Repost)
            break
          case EventActionType.Quote:
            newEvent.kind(EventKind.TextNote)
            break
          case EventActionType.Comment:
            newEvent.kind(EventKind.TextNote)
            break
        }

        relatedEvents.forEach(({ id, relay, author }) => {
          newEvent.tag([
            'e',
            id,
            relay ? relay.url : '',
            type === EventActionType.Quote
              ? 'mention'
              : type === EventActionType.Comment
              ? 'reply'
              : '',
          ])
          newEvent.tag([
            'p',
            author.hexpubkey,
            '',
            type === EventActionType.Quote
              ? 'mention'
              : type === EventActionType.Comment
              ? 'reply'
              : '',
          ])
        })

        // Array.from(
        //   new Set(
        //     transformText(content, [])
        //       .filter(({ type }) => type === 'hashtag')
        //       .map(({ content }) => content.toLowerCase()),
        //   ),
        // ).forEach((item) => newEvent.tag(['t', item]))

        if (positingOptions?.location && geohash) {
          const length = geohash.length
          for (let i = length - 1; i >= 1; i--) {
            newEvent.tag(['g', geohash.substring(0, i)])
          }

          /**
           * TODO: Create short link
           */
          if (appendMapLink) {
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
              noteContent += `\n---`
              noteContent += `\nWherostr Map | https://wherostr.social/m/?q=${geohash}`
              noteContent += `\nDuck Duck Go Maps | ${duckduck.url}`
              noteContent += `\nGoogle Maps | ${google.url}`

              await Promise.all([
                duckduck.event.publish(),
                google.event.publish(),
              ])
            }
          }
        }

        const nostrEvent = newEvent
          .content(noteContent)
          .processContent()
          .build()

        const powEvent = await powRef.current?.minePow(nostrEvent, 11)
        // console.log('powEvent', powEvent)
        const ev = new NDKEvent(ndk, powEvent)
        // console.log('ev', ev)

        await ev.publish(relaySet)
        setEventAction(undefined)
      } catch (err: any) {
        showSnackbar(err.message, {
          slotProps: {
            alert: { severity: 'error' },
          },
        })
        console.log(err)
      } finally {
        setPosting(false)
      }
    },
    [
      user,
      type,
      relatedEvents,
      positingOptions?.location,
      ndk,
      relaySet,
      appendMapLink,
      setEventAction,
      showSnackbar,
    ],
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
  const { getRootProps, getInputProps } = useDropzone(dropzoneOptions)

  const handlePostingOptionsChange = useCallback<
    NonNullable<PostingOptionsProps['onChange']>
  >((name, values) => {
    setPostingOptions(values)
  }, [])

  const [location, llError, llState] = usePromise(async () => {
    if (!geohashValue) return
    const ll = Geohash.decode(geohashValue)
    try {
      const result = await reverse([ll.lon, ll.lat])
      // const sub =
      //   result.address.suburb ||
      //   result.address.town ||
      //   result.address.county ||
      //   result.address.municipality ||
      //   result.address.village
      // `${sub ? sub + ', ' : ''}${result.address.state}, ${result.address.country}`
      return {
        name: `${result.address.state || result.address.province}, ${
          result.address.country
        }`,
        coordiantes: ll,
      }
    } catch (err) {
      return {
        name: `Unknown`,
        coordiantes: ll,
      }
    }
  }, [geohashValue])

  const disabled = useMemo(
    () => uploading || busy || posting || locating || llState === 'pending',
    [uploading, busy, posting, locating, llState],
  )

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
      <input {...getInputProps()} />
      <Box className="mt-3 grid gap-3 grid-cols-1">
        {type !== EventActionType.Repost && (
          <>
            <TextField
              value={contentValue}
              inputRef={inputRef}
              placeholder="What's on your mind?"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              required
              disabled={disabled}
              onPaste={(e) => {
                const mimeTypes = Object.keys(accept)
                const imageFile = Array.from(e.clipboardData.files).find(
                  (f) => {
                    return mimeTypes.includes(f.type)
                  },
                )
                if (imageFile) handleUploadFile([imageFile], [])
              }}
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
                  inputProps={{
                    style:
                      geohashValue || locating || llState === 'pending'
                        ? { display: 'none' }
                        : undefined,
                  }}
                  InputProps={{
                    readOnly: true,
                    startAdornment:
                      locating || llState === 'pending' ? (
                        <ListItem dense disableGutters>
                          <ListItemAvatar>
                            <Skeleton variant="circular">
                              <Avatar />
                            </Skeleton>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Skeleton width="80%" />}
                            secondary={<Skeleton width={160} />}
                          />
                        </ListItem>
                      ) : geohashValue && location ? (
                        <ListItem dense disableGutters>
                          <ListItemAvatar>
                            <Avatar>
                              <Place className="text-[white]" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={location?.name}
                            secondary={`${location?.coordiantes.lat}, ${location?.coordiantes.lon}`}
                          />
                        </ListItem>
                      ) : (
                        <Stack direction="row" spacing={0.5}>
                          <Chip
                            disabled={disabled}
                            label="GPS"
                            icon={<MyLocation />}
                            onClick={async () => {
                              setLocating(true)
                              const geo = await new Promise(
                                (resolve, reject) => {
                                  navigator.geolocation.getCurrentPosition(
                                    async (position) => {
                                      const geo = Geohash.encode(
                                        position.coords.latitude,
                                        position.coords.longitude,
                                        10,
                                      )
                                      resolve(geo)
                                    },
                                    (err) => {
                                      console.log('geolocation:error', err)
                                    },
                                  )
                                },
                              )
                              setValue('geohash', geo)
                              setLocating(false)
                            }}
                          />
                          {/* <Tooltip title="Coming soon">
                            <Chip
                              variant="outlined"
                              disabled={disabled}
                              label="GeoTagging"
                              icon={<ImageSearch />}
                              onClick={() => {}}
                            />
                          </Tooltip> */}
                          <Chip
                            disabled={disabled}
                            label="Choose from Map"
                            icon={<Map />}
                            onClick={() => {
                              handleShowMap(true)
                            }}
                          />
                        </Stack>
                      ),
                    endAdornment:
                      geohashValue && !locating && llState === 'resolved' ? (
                        <>
                          <IconButton
                            size="small"
                            color={appendMapLink ? 'secondary' : undefined}
                            sx={!appendMapLink ? { opacity: 0.7 } : undefined}
                            onClick={() => {
                              setAppendMapLink((prev) => !prev)
                            }}
                          >
                            {appendMapLink ? <Link /> : <LinkOff />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleClickClear('geohash')}
                          >
                            <Close />
                          </IconButton>
                        </>
                      ) : locating || llState === 'pending' ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : undefined,
                  }}
                  disabled={disabled}
                />
              </>
            )}
          </>
        )}
        {type !== EventActionType.Quote &&
          relatedEvents.map((item, index) => (
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
              <Box className="absolute right-0 bottom-0 border-t-2 border-l-2 border-secondary-dark p-2 rounded-tl-2xl text-contrast-secondary bg-secondary-dark">
                {renderActionTypeIcon()}
              </Box>
            </Box>
          ))}
        {previewEvent?.content && (
          <>
            <Typography color="text.secondary" className="pl-2">
              Preview
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
