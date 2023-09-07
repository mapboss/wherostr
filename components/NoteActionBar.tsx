'use client'
import { Box, IconButton, Typography } from '@mui/material'
import {
  CommentOutlined,
  ElectricBoltOutlined,
  EmojiEmotionsOutlined,
  FormatQuoteOutlined,
  RepeatOutlined,
} from '@mui/icons-material'
import { useCallback, useContext, useMemo } from 'react'
import { EventActionType, EventContext } from '@/contexts/EventContext'
import { NDKEvent, NDKKind, zapInvoiceFromEvent } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import usePromise from 'react-use-promise'
import numeral from 'numeral'
import { transformText, tryParseNostrLink } from '@snort/system'

const amountFormat = '0,0.[0]a'

const NoteActionBar = ({ event }: { event: NDKEvent }) => {
  const { ndk } = useContext(NostrContext)
  const { setEventAction } = useContext(EventContext)
  const [
    { reactions, reposts, quotes, comments, zaps } = {
      reactions: [],
      reposts: [],
      quotes: [],
      comments: [],
      zaps: [],
    },
  ] = usePromise(async () => {
    if (ndk && event) {
      const relatedEvents = Array.from(
        await ndk.fetchEvents({
          kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.Reaction, NDKKind.Zap],
          '#e': [event.id],
        }),
      )
      const quotes: NDKEvent[] = []
      const comments: NDKEvent[] = []
      relatedEvents.forEach((item) => {
        const { kind, content, tags } = item
        if (kind !== NDKKind.Text) {
          return
        }
        if (
          transformText(content, tags).filter(
            ({ type, content }) =>
              type === 'link' &&
              content.startsWith('nostr:nevent1') &&
              tryParseNostrLink(content)?.id === event.id,
          ).length > 0
        ) {
          quotes.push(item)
        } else {
          comments.push(item)
        }
      })
      return {
        reactions: relatedEvents.filter(
          ({ kind }) => kind === NDKKind.Reaction,
        ),
        reposts: relatedEvents.filter(({ kind }) => kind === NDKKind.Repost),
        quotes,
        comments,
        zaps: relatedEvents
          .filter(({ kind }) => kind === NDKKind.Zap)
          .map((item) => zapInvoiceFromEvent(item) || { amount: 0 }),
      }
    }
  }, [ndk, event])
  const {
    reactionAmount,
    repostAmount,
    quoteAmount,
    commentAmount,
    zapAmount,
  } = useMemo(
    () => ({
      reactionAmount: numeral(reactions.length).format(amountFormat),
      repostAmount: numeral(reposts.length).format(amountFormat),
      quoteAmount: numeral(quotes.length).format(amountFormat),
      commentAmount: numeral(comments.length).format(amountFormat),
      zapAmount: numeral(
        zaps.reduce((sum, { amount }) => sum + amount / 1000, 0),
      ).format(amountFormat),
    }),
    [comments, quotes, reactions, reposts, zaps],
  )
  const handleClickAction = useCallback(
    (type: EventActionType) => () => {
      setEventAction({
        type,
        event,
      })
    },
    [event, setEventAction],
  )
  return (
    <Box className="text-contrast-secondary grid grid-flow-col grid-rows-1 grid-cols-5 gap-2">
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex !text-contrast-secondary"
          size="small"
          onClick={handleClickAction(EventActionType.React)}
        >
          <EmojiEmotionsOutlined />
        </IconButton>
        <Typography variant="caption">{reactionAmount}</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex !text-contrast-secondary"
          size="small"
          onClick={handleClickAction(EventActionType.Repost)}
        >
          <RepeatOutlined />
        </IconButton>
        <Typography variant="caption">{repostAmount}</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex !text-contrast-secondary"
          size="small"
          onClick={handleClickAction(EventActionType.Quote)}
        >
          <FormatQuoteOutlined />
        </IconButton>
        <Typography variant="caption">{quoteAmount}</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex !text-contrast-secondary"
          size="small"
          onClick={handleClickAction(EventActionType.Comment)}
        >
          <CommentOutlined />
        </IconButton>
        <Typography variant="caption">{commentAmount}</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex"
          color="primary"
          size="small"
          onClick={handleClickAction(EventActionType.Zap)}
        >
          <ElectricBoltOutlined />
        </IconButton>
        <Typography variant="caption">{zapAmount}</Typography>
      </Box>
    </Box>
  )
}

export default NoteActionBar
