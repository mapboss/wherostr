'use client'
import 'react-photo-view/dist/react-photo-view.css'
import { useCallback, useContext, useMemo, useState } from 'react'
import {
  NostrPrefix,
  ParsedFragment,
  transformText,
  tryParseNostrLink,
} from '@snort/system'
import { Box, Link, Paper, Typography } from '@mui/material'
import { Fragment } from 'react'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import { FormatQuote, InfoOutlined } from '@mui/icons-material'
import NextLink from 'next/link'
import {
  EventActionType,
  AppContext,
  ProfileActionType,
} from '@/contexts/AppContext'
import { useEventCache } from '@/hooks/useCache'
import { Variant } from '@mui/material/styles/createTypography'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import { useUserProfile } from '@/hooks/useUserProfile'

const youtubeRegExp =
  /(?:https?:\/\/)?(?:www|m\.)?(?:youtu\.be\/|youtube\.com\/(?:live\/|shorts\/|embed\/|v\/|watch(?:\?|.+&)v=))([^#\&\?]*).*/
const youtubePlaylistRegExp =
  /(?:https?:\/\/)?(?:www|m\.)?(?:youtu\.be\/|youtube\.com\/(?:(?:playlist|embed)(?:\?|.+&)list=))([^#\&\?]*).*/

type RelatedNoteVariant = 'full' | 'fraction' | 'link'

const UserMentionLink = ({ id }: { id: string }) => {
  const { setProfileAction } = useContext(AppContext)
  const user = useUserProfile(id)
  const displayName = useMemo(
    () =>
      user?.profile?.displayName ||
      user?.profile?.name ||
      user?.profile?.username ||
      user?.npub.substring(0, 12),
    [user],
  )
  const handleClickProfile = useCallback(() => {
    if (!user?.hexpubkey) return
    setProfileAction({
      type: ProfileActionType.View,
      hexpubkey: user?.hexpubkey,
    })
  }, [setProfileAction, user?.hexpubkey])

  return (
    <Link
      component="a"
      underline="hover"
      color="primary"
      onClick={handleClickProfile}
    >
      @{displayName}
    </Link>
  )
}

const QuotedEvent = ({
  id,
  relatedNoteVariant,
}: {
  id: string
  relatedNoteVariant: RelatedNoteVariant
}) => {
  const { setEventAction } = useContext(AppContext)
  const [event] = useEventCache(id)
  const handleClickNote = useCallback(() => {
    if (event) {
      setEventAction({
        type: EventActionType.View,
        event,
        options: {
          quotes: true,
          comments: true,
        },
      })
    }
  }, [event, setEventAction])
  return relatedNoteVariant === 'link' ? (
    <Typography
      className="cursor-pointer"
      variant="caption"
      color="secondary"
      onClick={handleClickNote}
    >
      <FormatQuote className="mr-1" fontSize="small" />
      quoted note
    </Typography>
  ) : (
    <Box
      className={`relative my-2 border-2 border-secondary-dark rounded-2xl overflow-hidden cursor-pointer${
        relatedNoteVariant === 'fraction' ? ' max-h-80' : ''
      }`}
      onClick={handleClickNote}
    >
      {event && (
        <ShortTextNoteCard
          event={event}
          action={false}
          relatedNoteVariant="link"
        />
      )}
      {relatedNoteVariant === 'fraction' && (
        <Box className="absolute top-0 left-0 w-full h-full min-h-[320px] bg-gradient-to-t from-[#000000] to-50%" />
      )}
      <Box className="absolute right-0 bottom-0 border-t-2 border-l-2 border-secondary-dark p-2 rounded-tl-2xl text-contrast-secondary">
        <FormatQuote />
      </Box>
    </Box>
  )
}

const renderChunk = (
  { type, content, mimeType }: ParsedFragment,
  { relatedNoteVariant }: { relatedNoteVariant: RelatedNoteVariant },
) => {
  switch (type) {
    case 'media':
      if (mimeType?.startsWith('image/')) {
        return (
          <PhotoView src={content}>
            <img
              className="rounded-2xl overflow-hidden max-h-[344px]"
              src={content}
            />
          </PhotoView>
        )
      } else if (mimeType?.startsWith('audio/')) {
        return (
          <Box className="rounded-2xl overflow-hidden">
            <audio className="w-full" src={content} controls />
          </Box>
        )
      } else if (mimeType?.startsWith('video/')) {
        return (
          <Box className="rounded-2xl overflow-hidden">
            <video className="w-full max-h-[344px]" src={content} controls />
          </Box>
        )
      }
    case 'link':
      const youtubeId = (content.match(youtubeRegExp) || [])[1]
      if (youtubeId) {
        return (
          <iframe
            className="border-none rounded-2xl overflow-hidden w-full aspect-video"
            src={`https://www.youtube.com/embed/${youtubeId}`}
          />
        )
      }
      const youtubePlaylistId = (content.match(youtubePlaylistRegExp) || [])[1]
      if (youtubePlaylistId) {
        return (
          <iframe
            className="border-none rounded-2xl overflow-hidden w-full aspect-video"
            src={`https://www.youtube.com/embed?listType=playlist&list=${youtubePlaylistId}`}
          />
        )
      }
      const { protocol } = new URL(content)
      if (protocol === 'nostr:' || protocol === 'web+nostr:') {
        const nostrLink = tryParseNostrLink(content)
        const npub = nostrLink?.encode()
        switch (nostrLink?.type) {
          case NostrPrefix.PublicKey:
          case NostrPrefix.Profile:
            return <UserMentionLink id={nostrLink.id} />
          case NostrPrefix.Event:
            return (
              <QuotedEvent
                id={nostrLink.id}
                relatedNoteVariant={relatedNoteVariant}
              />
            )
          case NostrPrefix.Note:
          case NostrPrefix.Address:
            return (
              <Link
                className="block text-ellipsis whitespace-nowrap overflow-hidden"
                href={`https://snort.social/${npub}`}
                target="_blank"
                component="a"
                underline="hover"
                color="secondary"
              >
                {content}
              </Link>
            )
        }
      }
      return (
        <Link
          href={content}
          target="_blank"
          component="a"
          underline="hover"
          color="secondary"
        >
          {content}
        </Link>
      )
    case 'hashtag':
      return (
        <NextLink href={`/?keyword=${content}`}>
          <Link underline="hover" color="secondary" component="span">
            #{content}
          </Link>
        </NextLink>
      )
    // case 'custom_emoji':
    //   return `custom_emoji: ${content}`
    // case 'mention':
    //   return `mention: ${content}`
    // case 'invoice':
    //   return `invoice: ${content}`
    // case 'cashu':
    //   return `cashu: ${content}`
    // case 'text':
    default:
      return content
  }
}

const TextNote = ({
  event,
  relatedNoteVariant = 'fraction',
  textVariant = 'body1',
}: {
  event: Partial<NDKEvent>
  relatedNoteVariant?: RelatedNoteVariant
  textVariant?: Variant
}) => {
  const [show, setShow] = useState(false)
  const chunks = useMemo(() => {
    return transformText(event.content || '', event.tags || [])
  }, [event])

  const nsfw = useMemo(() => event.tagValue?.('content-warning'), [event])

  return (
    <Typography
      className="whitespace-break-spaces break-words"
      variant={textVariant}
      component="div"
    >
      {!nsfw || show ? (
        <PhotoProvider>
          {chunks.map((chunk, index) => (
            <Fragment key={index}>
              {renderChunk(chunk, {
                relatedNoteVariant,
              })}
            </Fragment>
          ))}
        </PhotoProvider>
      ) : (
        <Paper
          elevation={4}
          className="w-full flex items-center justify-center px-2 py-4"
          onClick={() => setShow(true)}
        >
          <Box mr={1} mt={1} display="flex" alignSelf="flex-start">
            <InfoOutlined className="text-primary" />
          </Box>
          <Box>
            <Typography display="inline" color="text.secondary">
              The author has marked this note as a
            </Typography>{' '}
            <Typography display="inline" color="primary.main">
              sensitive topic
            </Typography>
            <br />
            <Typography display="inline" color="text.secondary">
              Reason:
            </Typography>{' '}
            <Typography display="inline" color="primary.main">
              {nsfw}
            </Typography>
            <Typography color="secondary.dark">
              Click here to load anyway
            </Typography>
          </Box>
        </Paper>
      )}
    </Typography>
  )
}

export default TextNote
