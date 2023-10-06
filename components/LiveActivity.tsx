'use client'
import { NDKEvent, NDKTag } from '@nostr-dev-kit/ndk'
import { Box, Button, Chip, Paper, Toolbar, Typography } from '@mui/material'
import { LiveVideoPlayer } from './LiveVideoPlayer'
import { LiveChat } from './LiveChat'
import { useMemo } from 'react'
import { useUserCache } from '@/hooks/useCache'
import ProfileChip from './ProfileChip'
import { Bolt, Share, SubscriptionsSharp } from '@mui/icons-material'
import { LiveStreamTime } from './LiveStreamTime'

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
    <Box className="grid grid-cols-[auto_440px] gap-6 flex-1 flex-row-reverse overflow-hidden mt-16">
      <Box className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-0 gap-4">
        <Paper className="overflow-hidden">
          <LiveVideoPlayer
            stream={liveItem.recording || liveItem.streaming}
            autoPlay={autoplay}
            poster={liveItem.image}
          />
        </Paper>
        <Box className="flex my-4">
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold">
              {liveItem.title}
            </Typography>
            <Typography>{liveItem.summary}</Typography>
            <Box className="flex [&>div]:mx-1 mt-2">
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
              {liveItem.tags.map(([_, tag], i) => {
                return <Chip key={i} label={tag} />
              })}
            </Box>
          </Box>
          <Box className="flex items-start">
            <ProfileChip user={user} showName={false} />
            <Box component="span" mx={1} />
            <Button variant="outlined" color="inherit" startIcon={<Share />}>
              Share
            </Button>
            <Box component="span" mx={0.5} />
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<SubscriptionsSharp />}
            >
              Follow
            </Button>
            <Box component="span" mx={0.5} />
            <Button variant="contained" color="primary" startIcon={<Bolt />}>
              Zap
            </Button>
          </Box>
        </Box>
      </Box>
      <Paper className="overflow-hidden relative flex flex-col mb-4">
        <Toolbar>
          <Typography variant="h6" fontWeight="bold">
            Stream Chat
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
