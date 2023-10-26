'use client'
import ProfileChip from '@/components/ProfileChip'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useContext, useMemo, useState } from 'react'
import {
  Close,
  Comment,
  ElectricBolt,
  FormatQuote,
  Repeat,
} from '@mui/icons-material'
import { AccountContext } from '@/contexts/AccountContext'
import { EventActionType, AppContext } from '@/contexts/AppContext'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { useForm } from 'react-hook-form'
import { tryParseNostrLink, transformText } from '@snort/system'
import numeral from 'numeral'
import { requestProvider } from 'webln'
import { useEvents } from '@/hooks/useEvent'
import { CreateEventForm } from './CreateEventForm'
import { LoadingButton } from '@mui/lab'
import { useMuting } from '@/hooks/useAccount'
import { isComment } from '@/utils/event'
import { useNDK } from '@/hooks/useNostr'

const amountFormat = '0,0.[0]a'

const ZapEventForm = ({ event }: { event: NDKEvent }) => {
  const ndk = useNDK()
  const { setEventAction, showSnackbar } = useContext(AppContext)
  const { register, handleSubmit, setValue, watch } = useForm()
  const [loading, setLoading] = useState(false)
  const _amountValue = watch('amount')
  const _handleSubmit = useCallback(
    async (data: any) => {
      try {
        setLoading(true)
        const { amount, comment } = data
        const pr = await event.zap(
          amount * 1000,
          comment || undefined,
          undefined,
          ndk.getUser({
            hexpubkey: event.tagValue('p'),
          }),
        )
        if (pr) {
          await (await requestProvider()).sendPayment(pr)
          showSnackbar(`Zapped ${amount} sats`, {
            slotProps: {
              alert: {
                severity: 'success',
              },
            },
          })
          setEventAction(undefined)
        }
      } finally {
        setLoading(false)
      }
    },
    [event, ndk, setEventAction, showSnackbar],
  )
  const amountValue = useMemo(
    () => (_amountValue ? numeral(_amountValue).format(amountFormat) : '?'),
    [_amountValue],
  )
  const amountOptions = useMemo(
    () => [
      50, 100, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000,
    ],
    [],
  )
  const handleClickAmount = useCallback(
    (amount: Number) => () => {
      setValue('amount', amount)
    },
    [setValue],
  )

  return (
    <form onSubmit={handleSubmit(_handleSubmit)}>
      <Box className="mt-3 grid gap-3 grid-cols-1">
        <Box className="relative max-h-80 border-2 border-secondary-dark rounded-2xl overflow-hidden">
          <ShortTextNoteCard
            event={event}
            action={false}
            relatedNoteVariant="link"
          />
          <Box className="absolute top-0 left-0 w-full h-full min-h-[320px] bg-gradient-to-t from-[#000000] to-50%" />
          <Box className="absolute right-0 bottom-0 border-t-2 border-l-2 border-secondary-dark p-2 rounded-tl-2xl text-primary bg-secondary-dark">
            <ElectricBolt />
          </Box>
        </Box>
        <TextField
          disabled={loading}
          placeholder="Comment"
          variant="outlined"
          fullWidth
          {...register('comment')}
        />
        <Box className="flex gap-2 flex-wrap justify-center">
          {amountOptions.map((amount, index) => (
            <Button
              disabled={loading}
              key={index}
              color="secondary"
              variant="outlined"
              startIcon={<ElectricBolt className="!text-primary" />}
              onClick={handleClickAmount(amount)}
            >
              {numeral(amount).format(amountFormat)}
            </Button>
          ))}
        </Box>
        <TextField
          disabled={loading}
          placeholder="Amount"
          variant="outlined"
          type="number"
          fullWidth
          required
          InputProps={{
            startAdornment: (
              <InputAdornment className="!text-primary" position="start">
                <ElectricBolt />
              </InputAdornment>
            ),
            endAdornment: <InputAdornment position="end">sats</InputAdornment>,
            inputProps: {
              min: 1,
            },
          }}
          {...register('amount', {
            required: true,
            valueAsNumber: true,
            min: 1,
          })}
        />
        <Box className="flex justify-end">
          <LoadingButton
            loading={loading}
            variant="contained"
            type="submit"
            loadingPosition="start"
            startIcon={<ElectricBolt />}
          >
            {`Zap ${amountValue} sats`}
          </LoadingButton>
        </Box>
      </Box>
    </form>
  )
}

export const ShortTextNotePane = ({
  event,
  reposts = false,
  quotes = false,
  comments = false,
}: {
  event: NDKEvent
  reposts?: boolean
  quotes?: boolean
  comments?: boolean
}) => {
  const { eventAction, setEventAction } = useContext(AppContext)
  const [muteList] = useMuting()
  const filter = useMemo(() => {
    const kinds: NDKKind[] = []
    if (comments || quotes) {
      kinds.push(NDKKind.Text)
    }
    if (reposts) {
      kinds.push(NDKKind.Repost)
    }
    return { kinds, '#e': [event.id] }
  }, [event.id, reposts, quotes, comments])

  const [relatedEvents, error, state] = useEvents(filter)

  const relatedEventElements = useMemo(() => {
    if (!relatedEvents) return
    const repostEvents: NDKEvent[] = []
    const _quotes: NDKEvent[] = []
    const _comments: NDKEvent[] = []
    relatedEvents.forEach((item) => {
      if (muteList.includes(item.pubkey)) return
      const { content, tags, kind } = item
      if (kind === NDKKind.Repost) {
        repostEvents.push(item)
      } else {
        const linkFound =
          transformText(content, tags).filter(
            ({ type, content }) =>
              type === 'link' &&
              (content.startsWith('nostr:nevent1') ||
                content.startsWith('nostr:note1')) &&
              tryParseNostrLink(content)?.id === event.id,
          ).length > 0

        const iscomment = isComment(item)
        const e = item.getMatchingTags('e')
        if (comments && iscomment && !linkFound && e.at(-1)?.[1] === event.id) {
          _comments.push(item)
        } else if (
          comments &&
          iscomment &&
          !linkFound &&
          e.at(0)?.[3] === 'reply'
        ) {
          _comments.push(item)
        } else if (quotes) {
          if (linkFound) {
            _quotes.push(item)
          }
        }
      }
    })
    return [...repostEvents, ..._quotes, ..._comments]
      .sort((a, b) => a.created_at! - b.created_at!)
      .map((item) => {
        return (
          <ShortTextNoteCard
            key={item.id}
            event={item}
            depth={1}
            hideContent={item.kind === NDKKind.Repost}
            indentLine
          />
        )
      })
  }, [comments, event.id, quotes, relatedEvents, muteList])
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
    <Box>
      <ShortTextNoteCard event={event} indent={false} />
      {event.kind === NDKKind.Text && (
        <>
          <Box className="flex gap-3 p-3 justify-center">
            <Chip
              className={
                eventAction?.options?.reposts ? '!bg-secondary-dark' : undefined
              }
              label="Reposts"
              icon={<Repeat />}
              variant={eventAction?.options?.reposts ? 'filled' : 'outlined'}
              onClick={handleClickAction(EventActionType.View, {
                reposts: true,
              })}
            />
            <Chip
              className={
                eventAction?.options?.quotes ? '!bg-secondary-dark' : undefined
              }
              label="Quotes"
              icon={<FormatQuote />}
              variant={eventAction?.options?.quotes ? 'filled' : 'outlined'}
              onClick={handleClickAction(EventActionType.View, {
                quotes: true,
              })}
            />
            <Chip
              className={
                eventAction?.options?.comments
                  ? '!bg-secondary-dark'
                  : undefined
              }
              label="Comments"
              icon={<Comment />}
              variant={eventAction?.options?.comments ? 'filled' : 'outlined'}
              onClick={handleClickAction(EventActionType.View, {
                comments: true,
              })}
            />
          </Box>
          <Divider />
        </>
      )}
      {relatedEventElements ? (
        relatedEventElements
      ) : (
        <Box p={1} textAlign="center">
          <CircularProgress color="inherit" />
        </Box>
      )}
    </Box>
  )
}

const EventActionModal = () => {
  const { user } = useContext(AccountContext)
  const { eventAction, setEventAction } = useContext(AppContext)
  const handleClickCloseModal = useCallback(() => {
    setEventAction(undefined)
  }, [setEventAction])
  const renderAction = useCallback(() => {
    const { type, event } = eventAction || {}
    switch (type) {
      case EventActionType.Create:
      case EventActionType.Repost:
      case EventActionType.Quote:
      case EventActionType.Comment:
        return (
          <CreateEventForm
            type={type}
            relatedEvents={event ? [event] : undefined}
          />
        )
      case EventActionType.Zap:
        return event && <ZapEventForm event={event} />
      case EventActionType.View:
        return (
          event && (
            <ShortTextNotePane
              event={event}
              {...(eventAction?.options || {})}
            />
          )
        )
      default:
        return undefined
    }
  }, [eventAction])
  const title = useMemo(() => {
    const { type } = eventAction || {}
    switch (type) {
      case EventActionType.Create:
        return 'Create'
      case EventActionType.Repost:
        return 'Repost'
      case EventActionType.Quote:
        return 'Quote'
      case EventActionType.Comment:
        return 'Comment'
      case EventActionType.Zap:
        return 'Zap'
      case EventActionType.View:
        return 'Note'
      default:
        return undefined
    }
  }, [eventAction])
  return (
    eventAction && (
      <Box className="relative max-h-full flex rounded-2xl overflow-hidden p-0.5 bg-gradient-primary">
        <Paper className="w-full overflow-y-auto !rounded-2xl">
          <Paper className="sticky top-0 z-10">
            <Box className="flex items-center p-3 drop-shadow">
              <Typography className="flex-1" variant="h6">
                {title}
              </Typography>
              <IconButton size="small" onClick={handleClickCloseModal}>
                <Close />
              </IconButton>
            </Box>
            <Divider />
          </Paper>
          {eventAction.type !== EventActionType.View && (
            <ProfileChip className="pt-3 px-3" hexpubkey={user?.hexpubkey} />
          )}
          <Box
            className={
              eventAction.type !== EventActionType.View
                ? 'pb-3 px-3'
                : undefined
            }
          >
            {renderAction()}
          </Box>
        </Paper>
      </Box>
    )
  )
}

export default EventActionModal
