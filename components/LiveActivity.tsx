'use client'
import { NDKEvent, NDKTag } from '@nostr-dev-kit/ndk'
import { Box, Chip, Hidden, Paper, Toolbar, Typography } from '@mui/material'
import { LiveVideoPlayer } from './LiveVideoPlayer'
import { LiveChat } from './LiveChat'
import { useCallback, useContext, useMemo } from 'react'
import ProfileChip from './ProfileChip'
import { Bolt, Share, SubscriptionsSharp } from '@mui/icons-material'
import { LiveStreamTime } from './LiveStreamTime'
import ResponsiveButton from './ResponsiveButton'
import { AccountContext } from '@/contexts/AccountContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import StatusBadge from './StatusBadge'
import { AppContext, EventActionType } from '@/contexts/AppContext'

export interface LiveActivityItem {
  id: string
  author: string
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
  const { setEventAction } = useContext(AppContext)
  const { user, follows } = useContext(AccountContext)
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
      author: event?.pubkey || '',
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
  const author = useUserProfile(liveItem.pubkey)
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
    <Box className="grid gap-2 lg:gap-6 flex-1 overflow-hidden lg:mt-16 grid-cols-1 lg:grid-cols-[auto_440px]">
      <Box className="flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-0 gap-2">
        <Paper
          component={LiveVideoPlayer}
          className="relative overflow-hidden flex-auto lg:flex-none flex items-center justify-center"
          sx={{ aspectRatio: '16/9' }}
          stream={liveItem.recording || liveItem.streaming}
          autoPlay={autoplay}
          poster={liveItem.image}
        />
        <Box className="mx-2 flex flex-none flex-col overflow-visible items-stretch">
          <Box className="flex flex-1 items-stretch md:items-start overflow-hidden flex-col-reverse md:flex-row lg:flex-initial">
            <Hidden mdDown>
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
              </Box>
            </Hidden>
            <Box className="flex items-center gap-2">
              <ProfileChip hexpubkey={author?.hexpubkey} showNip5={false} />
              <Box className="flex-1 md:flex-auto" component="span" />
              <ResponsiveButton
                color="inherit"
                variant="outlined"
                size="small"
                startIcon={<Share />}
                onClick={handleClickAction(EventActionType.Quote)}
              >
                Share
              </ResponsiveButton>
              {liveItem.pubkey &&
                !follows.find((d) => d.hexpubkey === liveItem.pubkey) && (
                  <ResponsiveButton
                    color="inherit"
                    variant="outlined"
                    size="small"
                    startIcon={<SubscriptionsSharp />}
                    onClick={async () => {
                      if (!author) return
                      await user?.follow(author)
                    }}
                  >
                    Follow
                  </ResponsiveButton>
                )}
              <ResponsiveButton
                color="primary"
                variant="contained"
                size="small"
                startIcon={<Bolt />}
                onClick={handleClickAction(EventActionType.Zap)}
              >
                Zap
              </ResponsiveButton>
            </Box>
          </Box>
          <Hidden lgDown>
            <Typography
              color="text.secondary"
              overflow="hidden"
              textOverflow="ellipsis"
              maxHeight="3em"
            >
              {liveItem.summary}
            </Typography>
            <Box className="flex flex-wrap gap-2 mt-2 items-center">
              <StatusBadge status={liveItem.status} />
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
          </Hidden>
        </Box>
      </Box>
      <Paper className="overflow-hidden relative flex flex-col lg:mb-4">
        <Hidden lgDown>
          <Toolbar className="!min-h-[48px]">
            <Typography variant="h6" fontWeight="bold">
              Live Chat
            </Typography>
            <Box flex={1} />
            <Typography
              component="a"
              color="primary"
              sx={{ textDecoration: 'underline' }}
              href={`https://zap.stream/chat/${naddr}?chat=true`}
              target="_blank"
              variant="caption"
            >
              zap.stream
            </Typography>
          </Toolbar>
        </Hidden>
        <LiveChat naddr={naddr} flex={1} event={liveItem} />
      </Paper>
    </Box>
  )
}

export default LiveActivity
