'use client'
import { useContext, useEffect, useMemo, useState } from 'react'
import {
  NostrPrefix,
  ParsedFragment,
  transformText,
  tryParseNostrLink,
} from '@snort/system'
import { Box, Link, Typography } from '@mui/material'
import { Fragment } from 'react'
import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'

const youtubeRegExp =
  /(?:https?:\/\/)?(?:www|m\.)?(?:youtu\.be\/|youtube\.com\/(?:live\/|shorts\/|embed\/|v\/|watch(?:\?|.+&)v=))([^#\&\?]*).*/
const youtubePlaylistRegExp =
  /(?:https?:\/\/)?(?:www|m\.)?(?:youtu\.be\/|youtube\.com\/(?:(?:playlist|embed)(?:\?|.+&)list=))([^#\&\?]*).*/

const UserMentionLink = ({ id }: { id: string }) => {
  const { ndk } = useContext(NostrContext)
  const [user, setUser] = useState<NDKUser>()
  useEffect(() => {
    if (ndk && id) {
      const user = ndk.getUser({
        hexpubkey: id,
      })
      user.fetchProfile().then(() => {
        setUser(user)
      })
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

const renderChunk = ({ type, content, mimeType }: ParsedFragment) => {
  switch (type) {
    case 'media':
      if (mimeType?.startsWith('image/')) {
        return (
          <Box className="rounded-lg overflow-hidden">
            <img className="object-contain w-full" src={content} />
          </Box>
        )
      } else if (mimeType?.startsWith('audio/')) {
        return (
          <Box className="rounded-lg overflow-hidden">
            <audio className="w-full" src={content} controls />
          </Box>
        )
      } else if (mimeType?.startsWith('video/')) {
        return (
          <Box className="rounded-lg overflow-hidden">
            <video className="w-full" src={content} controls />
          </Box>
        )
      }
    case 'link':
      const youtubeId = (content.match(youtubeRegExp) || [])[1]
      if (youtubeId) {
        return (
          <iframe
            className="border-none rounded-lg overflow-hidden w-full aspect-video"
            src={`https://www.youtube.com/embed/${youtubeId}`}
          />
        )
      }
      const youtubePlaylistId = (content.match(youtubePlaylistRegExp) || [])[1]
      if (youtubePlaylistId) {
        return (
          <iframe
            className="border-none rounded-lg overflow-hidden w-full aspect-video"
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
          case NostrPrefix.Note:
          case NostrPrefix.Event:
          case NostrPrefix.Address:
            return (
              <Link
                href={npub}
                target="_blank"
                component="a"
                underline="hover"
                color="primary"
              >
                #{npub}
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
        <Link href="#" underline="hover" color="secondary">
          #{content}
        </Link>
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

const Content = ({ event }: { event: NDKEvent }) => {
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
        <Fragment key={index}>{renderChunk(chunk)}</Fragment>
      ))}
    </Typography>
  )
}

export default Content
