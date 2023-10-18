'use client'
import { Box, IconButton, Link, Tooltip, Typography } from '@mui/material'
import {
  Comment,
  ElectricBolt,
  FormatQuote,
  Repeat,
  ThumbUp,
} from '@mui/icons-material'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { EventActionType, AppContext } from '@/contexts/AppContext'
import {
  NDKEvent,
  NDKKind,
  NDKSubscriptionCacheUsage,
  zapInvoiceFromEvent,
} from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import usePromise from 'react-use-promise'
import numeral from 'numeral'
import { tryParseNostrLink, transformText } from '@snort/system'
import { AccountContext } from '@/contexts/AccountContext'

const amountFormat = '0,0.[0]a'

const NoteActionBar = ({ event }: { event: NDKEvent }) => {
  const { ndk, relaySet } = useContext(NostrContext)
  const { user } = useContext(AccountContext)
  const { setEventAction } = useContext(AppContext)
  const [reacted, setReacted] = useState<'+' | '-' | undefined>()
  const [{ liked, disliked }, setReaction] = useState({
    liked: 0,
    disliked: 0,
  })

  const fetchRelatedEvent = useCallback(async () => {
    if (!relaySet || !ndk || !event) return
    const events = await ndk.fetchEvents(
      {
        kinds: [NDKKind.Repost, NDKKind.Text, NDKKind.Zap, NDKKind.Reaction],
        '#e': [event.id],
      },
      { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
      relaySet,
    )

    const reactedEvent: NDKEvent[] = []
    const reacts: NDKEvent[] = []

    const repostEvents: NDKEvent[] = []
    const quoteAndCommentEvents: NDKEvent[] = []
    const zapEvents: NDKEvent[] = []

    events.forEach((evt) => {
      if (evt.kind === NDKKind.Text) {
        quoteAndCommentEvents.push(evt)
      } else if (evt.kind === NDKKind.Repost) {
        repostEvents.push(evt)
      } else if (evt.kind === NDKKind.Zap) {
        zapEvents.push(evt)
      } else if (evt.kind === NDKKind.Reaction) {
        if (evt.pubkey === user?.hexpubkey) {
          setReacted(evt.content === '-' ? '-' : '+')
        }
        reacts.push(evt)
      }
    })

    const quotes: NDKEvent[] = []
    const comments: NDKEvent[] = []
    quoteAndCommentEvents.forEach((item) => {
      const { content, tags } = item
      if (
        transformText(content, tags).filter(
          ({ type, content }) =>
            type === 'link' &&
            (content.startsWith('nostr:nevent1') ||
              content.startsWith('nostr:note1')) &&
            tryParseNostrLink(content)?.id === event.id,
        ).length > 0
      ) {
        quotes.push(item)
      } else if (item.getMatchingTags('e').at(-1)?.[1] === event.id) {
        comments.push(item)
      }
    })
    return {
      reacted: reactedEvent,
      reacts,
      reposts: repostEvents,
      quotes,
      comments,
      zaps: zapEvents.map((item) => zapInvoiceFromEvent(item) || { amount: 0 }),
    }
  }, [relaySet, ndk, event, user?.hexpubkey])

  const [data] = usePromise(fetchRelatedEvent, [fetchRelatedEvent])

  useEffect(() => {
    if (!data) return
    const reaction = data.reacts.reduce(
      (a, b) => {
        if (b.content !== '-') {
          a.liked += 1
        } else {
          a.disliked += 1
        }
        return a
      },
      { liked: 0, disliked: 0 },
    )
    setReaction(reaction)
  }, [data])

  const { repostAmount, quoteAmount, commentAmount, zapAmount } = useMemo(
    () => ({
      repostAmount: numeral(data?.reposts.length).format(amountFormat),
      quoteAmount: numeral(data?.quotes.length).format(amountFormat),
      commentAmount: numeral(data?.comments.length).format(amountFormat),
      zapAmount: numeral(
        data?.zaps.reduce((sum, { amount }) => sum + amount / 1000, 0),
      ).format(amountFormat),
    }),
    [data],
  )
  const handleClickReact = useCallback(
    (reaction: '+' | '-') => async () => {
      const newEvent = new NDKEvent(ndk)
      newEvent.kind = NDKKind.Reaction
      newEvent.content = reaction
      newEvent.tags = [
        ['e', event.id, event.relay?.url || ''].filter((item) => !!item),
      ]
      setReacted(reaction)
      setReaction({
        liked: liked + (reaction === '+' ? 1 : 0),
        disliked: disliked + (reaction === '-' ? 1 : 0),
      })
      await newEvent.publish(relaySet)
    },
    [event, ndk, liked, disliked, relaySet],
  )
  const handleClickAction = useCallback(
    (type: EventActionType, options?: any) => () => {
      setEventAction({
        type,
        event,
        options,
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
          {liked}
        </Typography>
        {/* <Tooltip title="Dislike">
          <IconButton
            className={reacted === '-' ? '!text-error' : undefined}
            size="small"
            disabled={!!reacted}
            onClick={handleClickReact('-')}
          >
            <ThumbDown />
          </IconButton>
        </Tooltip> */}
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
        <Link
          className="!text-contrast-secondary cursor-pointer"
          underline="hover"
          component="span"
          onClick={handleClickAction(EventActionType.View, { reposts: true })}
        >
          <Typography variant="caption">{repostAmount}</Typography>
        </Link>
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
        <Link
          className="!text-contrast-secondary cursor-pointer"
          underline="hover"
          component="span"
          onClick={handleClickAction(EventActionType.View, { quotes: true })}
        >
          <Typography variant="caption">{quoteAmount}</Typography>
        </Link>
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
        <Link
          className="!text-contrast-secondary cursor-pointer"
          underline="hover"
          component="span"
          onClick={handleClickAction(EventActionType.View, { comments: true })}
        >
          <Typography variant="caption">{commentAmount}</Typography>
        </Link>
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
