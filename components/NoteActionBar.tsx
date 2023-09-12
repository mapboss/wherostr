'use client'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import {
  Comment,
  ElectricBolt,
  FormatQuote,
  Repeat,
  ThumbDown,
  ThumbUp,
} from '@mui/icons-material'
import { useCallback, useContext, useMemo, useState } from 'react'
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
  const [reacted, setReacted] = useState<'+' | '-' | undefined>()
  const [{ liked, disliked }, setReaction] = useState({
    liked: 0,
    disliked: 0,
  })
  usePromise(async () => {
    if (ndk && event) {
      let [reactedEvent, relatedEventSet] = await Promise.all([
        ndk.fetchEvent({
          authors: [event.pubkey],
          kinds: [NDKKind.Reaction],
          '#e': [event.id],
        }),
        ndk.fetchEvents({
          kinds: [NDKKind.Reaction],
          '#e': [event.id],
        }),
      ])
      const relatedEvents = Array.from(relatedEventSet)
      setReacted(
        reactedEvent?.content === '+'
          ? '+'
          : reactedEvent?.content === '-'
          ? '-'
          : undefined,
      )
      setReaction({
        liked: relatedEvents.filter(({ content }) => content === '+').length,
        disliked: relatedEvents.filter(({ content }) => content === '-').length,
      })
    }
  }, [ndk, event])
  const reactionPercentage = useMemo(() => {
    return liked ? `${((liked / (liked + disliked)) * 100).toFixed(0)}%` : '-'
  }, [liked, disliked])
  const [
    { reposts, quotes, comments, zaps } = {
      reposts: [],
      quotes: [],
      comments: [],
      zaps: [],
    },
  ] = usePromise(async () => {
    if (ndk && event) {
      const relatedEvents = Array.from(
        await ndk.fetchEvents({
          kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.Zap],
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
        reposts: relatedEvents.filter(({ kind }) => kind === NDKKind.Repost),
        quotes,
        comments,
        zaps: relatedEvents
          .filter(({ kind }) => kind === NDKKind.Zap)
          .map((item) => zapInvoiceFromEvent(item) || { amount: 0 }),
      }
    }
  }, [ndk, event])
  const { repostAmount, quoteAmount, commentAmount, zapAmount } = useMemo(
    () => ({
      repostAmount: numeral(reposts.length).format(amountFormat),
      quoteAmount: numeral(quotes.length).format(amountFormat),
      commentAmount: numeral(comments.length).format(amountFormat),
      zapAmount: numeral(
        zaps.reduce((sum, { amount }) => sum + amount / 1000, 0),
      ).format(amountFormat),
    }),
    [comments, quotes, reposts, zaps],
  )
  const handleClickReact = useCallback(
    (reaction: '+' | '-') => async () => {
      const newEvent = new NDKEvent(ndk)
      newEvent.kind = NDKKind.Reaction
      newEvent.content = reaction
      newEvent.tags = [
        ['e', event.id, event.relay?.url || ''].filter((item) => !!item),
      ]
      await newEvent.publish()
      setReacted(reaction)
      setReaction({
        liked: liked + (reaction === '+' ? 1 : 0),
        disliked: disliked + (reaction === '-' ? 1 : 0),
      })
    },
    [event, ndk, liked, disliked],
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
    <Box className="text-contrast-secondary grid grid-flow-col grid-rows-1 grid-cols-5 gap-4">
      <Box className="flex flex-row items-center">
        <Tooltip title="Like">
          <IconButton
            className={reacted === '+' ? '!text-success' : undefined}
            size="small"
            disabled={!!reacted}
            onClick={handleClickReact('+')}
          >
            <ThumbUp />
          </IconButton>
        </Tooltip>
        <Typography className="w-8 text-center" variant="caption">
          {reactionPercentage}
        </Typography>
        <Tooltip title="Dislike">
          <IconButton
            className={reacted === '-' ? '!text-error' : undefined}
            size="small"
            disabled={!!reacted}
            onClick={handleClickReact('-')}
          >
            <ThumbDown />
          </IconButton>
        </Tooltip>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <Tooltip title="Repost">
          <IconButton
            size="small"
            onClick={handleClickAction(EventActionType.Repost)}
          >
            <Repeat />
          </IconButton>
        </Tooltip>
        <Typography variant="caption">{repostAmount}</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <Tooltip title="Quote">
          <IconButton
            size="small"
            onClick={handleClickAction(EventActionType.Quote)}
          >
            <FormatQuote />
          </IconButton>
        </Tooltip>
        <Typography variant="caption">{quoteAmount}</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <Tooltip title="Comment">
          <IconButton
            size="small"
            onClick={handleClickAction(EventActionType.Comment)}
          >
            <Comment />
          </IconButton>
        </Tooltip>
        <Typography variant="caption">{commentAmount}</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <Tooltip title="Zap">
          <IconButton
            color="primary"
            size="small"
            onClick={handleClickAction(EventActionType.Zap)}
          >
            <ElectricBolt />
          </IconButton>
        </Tooltip>
        <Typography variant="caption">{zapAmount}</Typography>
      </Box>
    </Box>
  )
}

export default NoteActionBar
