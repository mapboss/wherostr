'use client'
import { useSubscribe } from '@/hooks/useSubscribe'
import {
  Avatar,
  Box,
  Card,
  CardHeader,
  CardMedia,
  Chip,
  Divider,
  Typography,
} from '@mui/material'
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk'
import { FC, useMemo, useRef } from 'react'
import ReactTimeago from 'react-timeago'
import { nip19 } from 'nostr-tools'
import Link from 'next/link'
import { useUserCache } from '@/hooks/useCache'
import { WEEK, unixNow } from '@/utils/time'

export default function Page() {
  const since = useMemo(() => unixNow() - WEEK, [])
  const liveFilter = useMemo(() => {
    return {
      kinds: [30311 as NDKKind],
      since,
    } as NDKFilter
  }, [since])

  const [liveEvent] = useSubscribe(liveFilter, true)

  const liveItems = useMemo(() => {
    const items = liveEvent
      .filter(
        (item) =>
          item.tagValue('status') === 'live' &&
          item.tagValue('starts') &&
          item.tagValue('streaming'),
      )
      .slice()
      .sort(
        (a, b) => Number(b.tagValue('starts')) - Number(a.tagValue('starts')),
      )
    return items
  }, [liveEvent])

  const endedItems = useMemo(() => {
    const items = liveEvent
      .filter(
        (item) =>
          item.tagValue('status') === 'ended' && item.tagValue('recording'),
      )
      .slice()
      .sort(
        (a, b) =>
          Number(b.tagValue('ends') || b.created_at) -
          Number(a.tagValue('ends') || a.created_at),
      )
    return items.slice(0, 100)
  }, [liveEvent])

  const ref = useRef<HTMLDivElement | null>(null)

  return (
    <Box p={2} ref={ref} overflow={'auto'} flex={1}>
      <Typography variant="h4">Live</Typography>
      <Divider />
      <Box className="grid grid-cols-4 gap-8 m-8">
        {liveItems.map((item) => (
          <CardEvent key={item.deduplicationKey()} ev={item} />
        ))}
      </Box>
      <Box my={8} />
      <Typography variant="h4">Ended</Typography>
      <Divider />
      <Box className="grid grid-cols-4 gap-8 m-8">
        {endedItems.map((item) => (
          <CardEvent key={item.deduplicationKey()} ev={item} />
        ))}
      </Box>
    </Box>
  )
}

const CardEvent: FC<{
  ev: NDKEvent
}> = ({ ev }) => {
  const id = ev.tagValue('d') || ''
  const pubkey = ev.tagValue('p') || ev.pubkey
  const title = ev.tagValue('title')
  const summary = ev.tagValue('summary')
  const image = ev.tagValue('image')
  const starts = Number(ev.tagValue('starts') || ev.created_at)
  const ends = Number(ev.tagValue('ends') || ev.created_at)
  const isLive = ev.tagValue('status') === 'live'
  const viewers = ev.tagValue('current_participants')
  const nostrLink = useMemo(
    () =>
      nip19.naddrEncode({
        identifier: id,
        kind: ev.kind!,
        pubkey: ev.pubkey,
      }),
    [ev.kind, ev.pubkey, id],
  )
  const [user] = useUserCache(pubkey)
  return (
    <Card key={id}>
      <CardMedia
        component={Link}
        href={`/a?naddr=${nostrLink}`}
        sx={{
          backgroundImage: `url(${image})`,
          aspectRatio: '16/9',
          position: 'relative',
        }}
      >
        <Box
          position="absolute"
          right={8}
          top={8}
          display="flex"
          flexDirection="column"
          alignItems="flex-end"
        >
          <Chip
            size="small"
            color={isLive ? 'primary' : 'default'}
            label={isLive ? 'LIVE' : 'ENDED'}
            sx={{
              fontWeight: 'bold',
              bgcolor: !isLive ? 'background.paper' : undefined,
            }}
          />
          {isLive && typeof viewers !== 'undefined' ? (
            <>
              <Box my={0.5} />
              <Chip
                size="small"
                color="default"
                label={viewers + ' viewers'}
                sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}
              />
            </>
          ) : null}
        </Box>
      </CardMedia>
      <CardHeader
        avatar={
          <Avatar src={user?.profile?.image}>
            {user?.profile?.displayName?.substring(0, 1)}
          </Avatar>
        }
        title={title}
        subheader={
          <Box component="span" display="flex" flexDirection="column">
            <Typography variant="caption">
              {user?.profile?.displayName}
            </Typography>
            <ReactTimeago date={new Date((isLive ? starts : ends) * 1000)} />
          </Box>
        }
        titleTypographyProps={{
          noWrap: true,
        }}
        subheaderTypographyProps={{
          variant: 'caption',
          noWrap: true,
        }}
        classes={{
          content: 'overflow-hidden',
        }}
      />
    </Card>
  )
}
