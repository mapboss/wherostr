'use client'
import UserBar from '@/components/UserBar'
import { AccountContext } from '@/contexts/AccountContext'
import { NostrContext } from '@/contexts/NostrContext'
import { useUser } from '@/hooks/useAccount'
import { useNDK, useStreamRelaySet } from '@/hooks/useNostr'
import { useSubscribe } from '@/hooks/useSubscribe'
import { WEEK, unixNow } from '@/utils/time'
import {
  Box,
  Button,
  Chip,
  Divider,
  TextField,
  Typography,
} from '@mui/material'
import { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk'
import {
  FormEvent,
  FormEventHandler,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

let timeoutHandler: NodeJS.Timeout
export default function Page() {
  const ndk = useNDK()
  const user = useUser()
  const since = useMemo(() => unixNow() - WEEK, [])
  const [ev, setEv] = useState<NDKEvent>()
  const filter = useMemo<NDKFilter | undefined>(() => {
    return {
      kinds: [30311 as NDKKind],
      authors: user?.hexpubkey ? [user.hexpubkey] : [],
      since,
    }
  }, [since, user])
  const relaySet = useStreamRelaySet()
  const [items] = useSubscribe(filter, true, relaySet)

  useEffect(() => {
    setEv(items[0])
  }, [items])

  const fetchStatsUrl = useMemo(() => {
    const streamingUrl = ev?.tagValue('streaming')
    if (!streamingUrl) return
    const url = new URL(streamingUrl)
    const streamKey = streamingUrl?.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    )?.[0]
    return `${url.protocol}//${url.host}/api/v3/widget/process/restreamer-ui:ingest:${streamKey}`
  }, [ev])

  const fetchStats = useCallback(async () => {
    if (!fetchStatsUrl) return
    try {
      const result = await fetch(fetchStatsUrl)
      const jsonResult = await result.json()
      return {
        viewers: jsonResult.current_sessions,
        uptime: jsonResult.uptime,
      }
    } catch (err) {
      console.log(err)
    }
  }, [fetchStatsUrl])

  const createEvent = useCallback(() => {
    if (!ndk || !ev) return
    const ndkEvent = new NDKEvent(ndk)
    ndkEvent.content = ev.content
    ndkEvent.kind = ev.kind
    ndkEvent.author = ev.author
    ndkEvent.tags = ev.tags
    return ndkEvent
  }, [ndk, ev])

  const updateLiveStats = useCallback(
    async (ev: NDKEvent) => {
      try {
        if (ev.tagValue('status') !== 'live') return
        const stats = await fetchStats().catch((err) => console.error(err))
        if (!stats) return
        let currentPaticipants = ev.tagValue('current_participants') || '0'
        if (currentPaticipants === stats.viewers?.toString()) return
        if (!currentPaticipants) return
        currentPaticipants = stats.viewers?.toString()
        const ndkEvent = createEvent()
        if (!ndkEvent) return
        ndkEvent.removeTag('current_participants')
        ndkEvent.tags.push(['current_participants', currentPaticipants])
        ev.removeTag('current_participants')
        ev.tags.push(['current_participants', currentPaticipants])
        await ndkEvent.publish()
      } catch (err) {
      } finally {
        timeoutHandler = setTimeout(() => {
          updateLiveStats(ev)
        }, 30000)
      }
    },
    [fetchStats, createEvent],
  )

  useEffect(() => {
    clearTimeout(timeoutHandler)
    if (!ev) return
    updateLiveStats(ev)
    return () => {
      clearTimeout(timeoutHandler)
    }
  }, [ev, updateLiveStats])

  const handleUpdate = useCallback<(name: string) => FormEventHandler>(
    (name: string) => async (evt: FormEvent<HTMLFormElement>) => {
      evt.preventDefault()
      if (!ev) return
      const form = new FormData(evt.currentTarget)
      const value = form.get(name)?.toString()
      if (!value) return
      const ndkEvent = createEvent()
      if (!ndkEvent) return
      if (ndkEvent.tagValue('status') === 'ended') {
        ev.removeTag(name)
        ndkEvent.removeTag(name)
      }
      ev.removeTag(name)
      ev.tags.push([name, value])
      ndkEvent.removeTag(name)
      ndkEvent.tags.push([name, value])
      await ndkEvent.publish()
    },
    [ev, createEvent],
  )

  const isLive = useMemo(() => ev?.tagValue('status') === 'live', [ev])
  const tags = useMemo(() => ev?.getMatchingTags('t') || [], [ev])
  return (
    <>
      <Box alignSelf="flex-end">
        <UserBar />
      </Box>
      <Box className="flex-1 flex flex-col p-4">
        {ev ? (
          <>
            <Typography variant="h6" fontWeight="bold">
              {ev?.tagValue('title')}
            </Typography>
            <Typography>{ev?.tagValue('summary')}</Typography>
            <Box className="flex mt-2 gap-2">
              <Chip
                color={isLive ? 'primary' : 'secondary'}
                label={isLive ? 'LIVE' : 'ENDED'}
              />
              {isLive && (
                <Chip
                  variant="outlined"
                  label={
                    (ev?.tagValue('current_participants') || 0) + ' viewers'
                  }
                />
              )}
              {tags.map(([_, tag], i) => {
                return <Chip key={i} label={tag} />
              })}
            </Box>
            {isLive ? (
              <Box component="form" onSubmit={handleUpdate('streaming')}>
                <Divider className="!my-4" />
                <TextField
                  fullWidth
                  margin="dense"
                  size="small"
                  name="streaming"
                  autoComplete="off"
                  label="Streaming URL"
                  placeholder="https://..."
                  defaultValue={ev?.tagValue('streaming')}
                  InputProps={{
                    sx: { pr: 0 },
                    endAdornment: (
                      <Button type="submit" variant="contained">
                        Update
                      </Button>
                    ),
                  }}
                />
              </Box>
            ) : undefined}
            {!isLive ? (
              <Box component="form" onSubmit={handleUpdate('recording')}>
                <Divider className="!my-4" />
                <TextField
                  fullWidth
                  margin="dense"
                  size="small"
                  name="recording"
                  autoComplete="off"
                  label="Recording URL"
                  placeholder="https://..."
                  defaultValue={ev?.tagValue('recording')}
                  InputProps={{
                    sx: { pr: 0 },
                    endAdornment: (
                      <Button type="submit" variant="contained">
                        Update
                      </Button>
                    ),
                  }}
                />
              </Box>
            ) : undefined}
          </>
        ) : (
          <Typography>No Live Event.</Typography>
        )}
      </Box>
    </>
  )
}
