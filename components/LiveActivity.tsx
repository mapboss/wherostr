'use client'
import { NDKEvent, NDKTag } from '@nostr-dev-kit/ndk'
import {
  Box,
  Button,
  ButtonProps,
  Chip,
  Hidden,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { LiveVideoPlayer } from './LiveVideoPlayer'
import { LiveChat } from './LiveChat'
import { FC, useMemo } from 'react'
import { useUserCache } from '@/hooks/useCache'
import ProfileChip from './ProfileChip'
import {
  Bolt,
  ChevronLeft,
  Share,
  SubscriptionsSharp,
} from '@mui/icons-material'
import { LiveStreamTime } from './LiveStreamTime'
import ResponsiveButton from './ResponsiveButton'

export interface LiveActivityItem {
  id: string
  pubkey: string
  title: string
  summary?: string
  image?: string
  starts: number
  ends: number
  status?: 'live' | 'ended'
  viewers?: string
  streaming?: string
  recording?: string
  tags: NDKTag[]
}

const LiveActivity = ({
  naddr,
  event,
}: {
  naddr: string
  event?: NDKEvent
}) => {
  const liveItem = useMemo<LiveActivityItem>(() => {
    const id = event?.tagValue('d') || ''
    const pubkey = event?.tagValue('p') || event?.pubkey || ''
    const title = event?.tagValue('title') || ''
    const summary = event?.tagValue('summary')
    const image = event?.tagValue('image')
    const starts = Number(event?.tagValue('starts'))
    const ends = Number(event?.tagValue('ends'))
    const status = event?.tagValue('status') === 'live' ? 'live' : 'ended'
    const viewers = event?.tagValue('current_participants')
    const streaming = event?.tagValue('streaming')
    const recording = event?.tagValue('recording')
    const tags = event?.getMatchingTags('t') || []
    return {
      id,
      pubkey,
      title,
      summary,
      image,
      starts,
      ends,
      status,
      viewers,
      streaming,
      recording,
      tags,
    }
  }, [event])

  const autoplay = useMemo(() => liveItem.status === 'live', [liveItem.status])
  const [user] = useUserCache(liveItem.pubkey)
  return (
    <Box className="grid gap-2 lg:gap-6 flex-1 overflow-hidden lg:mt-16 grid-cols-1 lg:grid-cols-[auto_400px]">
      <Box className="flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-0 gap-2">
        <Paper
          component={LiveVideoPlayer}
          className="overflow-hidden flex-auto"
          stream={liveItem.recording || liveItem.streaming}
          autoPlay={autoplay}
          poster={liveItem.image}
        />
        <Box className="mx-2 flex flex-auto flex-col overflow-visible items-stretch">
          <Box className="flex flex-1 items-stretch sm:items-start overflow-hidden flex-col-reverse sm:flex-row lg:flex-initial">
            <Box className="flex-1 overflow-hidden mr-2">
              <Typography
                variant="h6"
                fontWeight="bold"
                noWrap
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {liveItem.title}
              </Typography>
              <Typography color="text.secondary">{liveItem.summary}</Typography>
            </Box>
            <Box className="flex items-center">
              <ProfileChip user={user} showName={false} />
              <Box className="flex-1 sm:flex-auto" component="span" mx={1} />
              <ResponsiveButton
                color="inherit"
                variant="outlined"
                size="small"
                startIcon={<Share />}
              >
                Share
              </ResponsiveButton>
              <Box component="span" mx={0.5} />
              <ResponsiveButton
                color="inherit"
                variant="outlined"
                size="small"
                startIcon={<SubscriptionsSharp />}
              >
                Follow
              </ResponsiveButton>
              <Box component="span" mx={0.5} />
              <ResponsiveButton
                color="primary"
                variant="contained"
                size="small"
                startIcon={<Bolt />}
              >
                Zap
              </ResponsiveButton>
            </Box>
          </Box>
          <Box className="flex flex-wrap gap-1 mt-2">
            <Chip
              sx={{ fontWeight: 'bold' }}
              label={liveItem.status?.toUpperCase()}
              color={liveItem.status === 'live' ? 'primary' : 'secondary'}
            />
            {liveItem.status === 'live' && (
              <>
                {typeof liveItem.viewers !== 'undefined' && (
                  <Chip
                    sx={{ fontWeight: 'bold' }}
                    variant="outlined"
                    label={`${liveItem.viewers} viewers`}
                  />
                )}
                <Chip
                  sx={{ fontWeight: 'bold' }}
                  variant="outlined"
                  label={<LiveStreamTime starts={liveItem.starts} />}
                />
              </>
            )}
            <Hidden mdDown>
              {liveItem.tags.map(([_, tag], i) => {
                return <Chip key={i} label={tag} />
              })}
            </Hidden>
          </Box>
        </Box>
      </Box>
      <Paper className="overflow-hidden relative flex flex-col lg:mb-4">
        <Toolbar className="!min-h-[48px]">
          <Typography variant="h6" fontWeight="bold">
            Live Chat
          </Typography>
          <Box flex={1} />
          <Typography variant="caption">noStrudel.ninja</Typography>
        </Toolbar>
        <LiveChat naddr={naddr} flex={1} event={liveItem} />
      </Paper>
    </Box>
  )
}

export default LiveActivity
