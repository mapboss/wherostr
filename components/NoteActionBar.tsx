'use client'
import { Box, Button, Tooltip, Typography } from '@mui/material'
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
import usePromise from 'react-use-promise'
import numeral from 'numeral'
import { tryParseNostrLink, transformText } from '@snort/system'
import { useNDK, useRelaySet } from '@/hooks/useNostr'
import { useMuting, useUser } from '@/hooks/useAccount'
import { useUserProfile } from '@/hooks/useUserProfile'

const amountFormat = '0,0.[0]a'

const NoteActionBar = ({ event }: { event: NDKEvent }) => {
  const ndk = useNDK()
  const relaySet = useRelaySet()
  const user = useUser()
  const [muteList] = useMuting()
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
      { cacheUsage: NDKSubscriptionCacheUsage.PARALLEL },
      relaySet,
    )

    const reactedEvent: NDKEvent[] = []
    const reacts: NDKEvent[] = []

    const repostEvents: NDKEvent[] = []
    const quoteAndCommentEvents: NDKEvent[] = []
    const zapEvents: NDKEvent[] = []

    events.forEach((evt) => {
      if (evt.kind === NDKKind.Text) {
        if (muteList.includes(evt.pubkey)) return
        quoteAndCommentEvents.push(evt)
      } else if (evt.kind === NDKKind.Repost) {
        if (muteList.includes(evt.pubkey)) return
        repostEvents.push(evt)
      } else if (evt.kind === NDKKind.Zap) {
        zapEvents.push(evt)
      } else if (evt.kind === NDKKind.Reaction) {
        if (muteList.includes(evt.pubkey)) return
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
      } else if (item.getMatchingTags('e').some((d) => d?.[1] === event.id)) {
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
  }, [relaySet, ndk, event, muteList, user?.hexpubkey])

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
  const likeAmount = useMemo(() => numeral(liked).format(amountFormat), [liked])
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
      // console.log('relaySet', relaySet)
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

  const author = useUserProfile(event.pubkey)

  return (
    <Box className="text-contrast-secondary grid grid-flow-col grid-rows-1 grid-cols-5 gap-1">
      <Tooltip title="Repost">
        <Button
          color="inherit"
          size="small"
          onClick={handleClickAction(EventActionType.Repost)}
          startIcon={<Repeat />}
        >
          <Typography className="!w-7 text-left" variant="caption">
            {repostAmount}
          </Typography>
        </Button>
      </Tooltip>
      <Tooltip title="Quote">
        <Button
          color="inherit"
          size="small"
          onClick={handleClickAction(EventActionType.Quote)}
          startIcon={<FormatQuote />}
        >
          <Typography className="!w-7 text-left" variant="caption">
            {quoteAmount}
          </Typography>
        </Button>
      </Tooltip>
      <Tooltip title="Comment">
        <Button
          color="inherit"
          size="small"
          onClick={handleClickAction(EventActionType.Comment)}
          startIcon={<Comment />}
        >
          <Typography className="!w-7 text-left" variant="caption">
            {commentAmount}
          </Typography>
        </Button>
      </Tooltip>
      <Tooltip title="Like">
        <Button
          color="inherit"
          size="small"
          onClick={handleClickReact('+')}
          startIcon={
            <ThumbUp
              className={reacted === '+' ? '!text-secondary' : undefined}
            />
          }
        >
          <Typography className="!w-7 text-left" variant="caption">
            {likeAmount}
          </Typography>
        </Button>
      </Tooltip>
      <Tooltip title="Zap">
        <Button
          color="inherit"
          disabled={!author?.profile?.lud16 && !author?.profile?.lud06}
          size="small"
          onClick={handleClickAction(EventActionType.Zap)}
          startIcon={<ElectricBolt color="primary" />}
        >
          <Typography className="!w-7 text-left" variant="caption">
            {zapAmount}
          </Typography>
        </Button>
      </Tooltip>
    </Box>
  )
}

export default NoteActionBar
