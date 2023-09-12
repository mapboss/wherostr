'use client'
import { useContext, useMemo } from 'react'
import {
  NostrPrefix,
  ParsedFragment,
  transformText,
  tryParseNostrLink,
} from '@snort/system'
import { Box, Link, Typography } from '@mui/material'
import { Fragment } from 'react'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import usePromise from 'react-use-promise'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import { FormatQuote } from '@mui/icons-material'
import NextLink from 'next/link'

const youtubeRegExp =
  /(?:https?:\/\/)?(?:www|m\.)?(?:youtu\.be\/|youtube\.com\/(?:live\/|shorts\/|embed\/|v\/|watch(?:\?|.+&)v=))([^#\&\?]*).*/
const youtubePlaylistRegExp =
  /(?:https?:\/\/)?(?:www|m\.)?(?:youtu\.be\/|youtube\.com\/(?:(?:playlist|embed)(?:\?|.+&)list=))([^#\&\?]*).*/

const UserMentionLink = ({ id }: { id: string }) => {
  const { ndk } = useContext(NostrContext)
  const [user] = usePromise(async () => {
    if (ndk && id) {
      const user = ndk.getUser({
        hexpubkey: id,
      })
      await user.fetchProfile()
      return user
    }
  }, [ndk, id])
  const displayName = useMemo(
    () => user?.profile?.displayName || user?.profile?.name || user?.npub,
    [user],
  )
  return (
    <Link
      href={id}
      target="_blank"
      component="a"
      underline="hover"
      color="primary"
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
  relatedNoteVariant: 'full' | 'fraction'
}) => {
  const { ndk } = useContext(NostrContext)
  const [event] = usePromise(async () => {
    if (ndk && id) {
      return await ndk.fetchEvent(id)
    }
  }, [ndk, id])
  return (
    <Box
      className={`relative my-2 border-2 border-secondary-dark rounded-2xl overflow-hidden${
        relatedNoteVariant === 'fraction' ? ' max-h-80' : ''
      }`}
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
  { relatedNoteVariant }: { relatedNoteVariant: 'full' | 'fraction' | 'link' },
) => {
  switch (type) {
    case 'media':
      if (mimeType?.startsWith('image/')) {
        return (
          <Box className="rounded-2xl overflow-hidden">
            <img className="object-contain w-full" src={content} />
          </Box>
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
            <video className="w-full" src={content} controls />
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
            if (relatedNoteVariant !== 'link') {
              return (
                <QuotedEvent
                  id={nostrLink.id}
                  relatedNoteVariant={relatedNoteVariant}
                />
              )
            }
          case NostrPrefix.Note:
          case NostrPrefix.Address:
            return (
              <Link
                className="block text-ellipsis whitespace-nowrap overflow-hidden"
                href={npub}
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
}: {
  event: NDKEvent
  relatedNoteVariant?: 'full' | 'fraction' | 'link'
}) => {
  const chunks = useMemo(() => {
    return transformText(event.content, event.tags)
  }, [event])
  return (
    <Typography
      className="whitespace-break-spaces break-words"
      variant="body1"
      component="div"
    >
      {chunks.map((chunk, index) => (
        <Fragment key={index}>
          {renderChunk(chunk, {
            relatedNoteVariant,
          })}
        </Fragment>
      ))}
    </Typography>
  )
}

export default TextNote
