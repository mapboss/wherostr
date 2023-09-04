'use client'
import { useMemo } from 'react'
import { ParsedFragment, TaggedNostrEvent, transformText } from '@snort/system'
import { Box, Link, Typography } from '@mui/material'

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
        return <audio src={content} controls />
      } else if (mimeType?.startsWith('video/')) {
        return <video src={content} controls />
      }
    case 'link':
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
    case 'mention':
      return `mention: ${content}`
    case 'invoice':
      return `invoice: ${content}`
    case 'cashu':
      return `cashu: ${content}`
    case 'hashtag':
      return (
        <Link href="#" underline="hover" color="secondary">
          #{content}
        </Link>
      )
    case 'custom_emoji':
      return `custom_emoji: ${content}`
    case 'text':
    default:
      return content
  }
}

const Content = ({ event }: { event: TaggedNostrEvent }) => {
  const chunks = useMemo(() => {
    return transformText(event.content, event.tags)
  }, [event])
  console.log('chunks', chunks)
  return (
    <Typography className="whitespace-break-spaces break-words" variant="body1">
      {chunks.map(renderChunk)}
    </Typography>
  )
  // return (
  //   <Box className="grid grid-flow-col gap-2">
  //     <Typography
  //       className="overflow-x-hidden whitespace-break-spaces break-words"
  //       variant="body2"
  //     >
  //       <span>{event.content}</span>
  //     </Typography>
  //     <Box
  //       className="w-20 h-20 bg-cover rounded-lg"
  //       style={{
  //         backgroundImage:
  //           'url(https://primal.b-cdn.net/media-cache?s=o&a=1&u=https%3A%2F%2Fm.primal.net%2FHKHZ.jpg)',
  //       }}
  //     />
  //   </Box>
  // )
}

export default Content
