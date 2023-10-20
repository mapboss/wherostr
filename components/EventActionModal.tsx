'use client'
import ProfileChip from '@/components/ProfileChip'
import ShortTextNoteCard from '@/components/ShortTextNoteCard'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useContext, useMemo } from 'react'
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

const amountFormat = '0,0.[0]a'

const ZapEventForm = ({ event }: { event: NDKEvent }) => {
  const { setEventAction } = useContext(AppContext)
  const { register, handleSubmit, setValue, watch } = useForm()
  const _amountValue = watch('amount')
  const _handleSubmit = useCallback(
    async (data: any) => {
      const { amount, comment } = data
      const pr = await event.zap(amount * 1000, comment || undefined)
      if (pr) {
        await (await requestProvider()).sendPayment(pr)
        alert('Zapped')
        setEventAction(undefined)
      }
    },
    [event, setEventAction],
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
          <Box className="absolute right-0 bottom-0 border-t-2 border-l-2 border-secondary-dark p-2 rounded-tl-2xl text-primary">
            <ElectricBolt />
          </Box>
        </Box>
        <TextField
          placeholder="Comment"
          variant="outlined"
          fullWidth
          {...register('comment')}
        />
        <Box className="flex gap-2 flex-wrap justify-center">
          {amountOptions.map((amount, index) => (
            <Button
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
          <Button
            variant="contained"
            type="submit"
            startIcon={<ElectricBolt />}
          >
            {`Zap ${amountValue} sats`}
          </Button>
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
        if (quotes && linkFound) {
          _quotes.push(item)
        } else if (
          comments &&
          !linkFound &&
          item.getMatchingTags('e').at(-1)?.[1] === event.id
        ) {
          _comments.push(item)
        }
      }
    })
    return [...repostEvents, ..._quotes, ..._comments]
      .sort((a, b) => a.created_at! - b.created_at!)
      .map((item) => <ShortTextNoteCard key={item.id} event={item} depth={1} />)
  }, [comments, event.id, quotes, relatedEvents])

  return (
    <Box>
      <ShortTextNoteCard event={event} />
      <Box className="ml-4 border-l border-[rgba(255,255,255,0.12)]">
        {relatedEventElements ? (
          relatedEventElements
        ) : (
          <Box p={1} textAlign="center">
            <CircularProgress color="inherit" />
          </Box>
        )}
      </Box>
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
    if (eventAction?.type === EventActionType.View) {
      if (
        [
          eventAction.options?.reposts,
          eventAction.options?.quotes,
          eventAction.options?.comments,
        ].filter((item) => !!item).length === 1
      ) {
        if (eventAction.options?.reposts) {
          return (
            <>
              <Repeat className="mr-2" />
              Reposts
            </>
          )
        } else if (eventAction.options?.quotes) {
          return (
            <>
              <FormatQuote className="mr-2" />
              Quotes
            </>
          )
        } else if (eventAction.options?.comments) {
          return (
            <>
              <Comment className="mr-2" />
              Comments
            </>
          )
        }
      } else {
        return [
          eventAction.options?.reposts && 'Reposts',
          eventAction.options?.quotes && 'Quotes',
          eventAction.options?.comments && 'Comments',
        ]
          .filter((item) => !!item)
          .join(', ')
      }
    }
  }, [eventAction])
  return (
    eventAction && (
      <Box className="relative max-h-full flex rounded-2xl overflow-hidden p-0.5 bg-gradient-primary">
        <IconButton
          className="!absolute top-4 right-4 z-10 !bg-[#0000001f]"
          size="small"
          onClick={handleClickCloseModal}
        >
          <Close />
        </IconButton>
        <Paper className="w-full overflow-y-auto pt-3 !rounded-2xl">
          <Box className="flex justify-between items-center px-4">
            {eventAction.type === EventActionType.View ? (
              <Typography variant="body1">{title}</Typography>
            ) : (
              <ProfileChip hexpubkey={user?.hexpubkey} />
            )}
          </Box>
          <Box
            className={
              eventAction.type !== EventActionType.View
                ? 'pb-3 px-4'
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
