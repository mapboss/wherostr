'use client'
import EventList from '@/components/EventList'
import { Box, Divider, IconButton, Paper } from '@mui/material'
import { useCallback, useContext, useMemo, useRef } from 'react'
import { Close } from '@mui/icons-material'
import { AppContext } from '@/contexts/AppContext'
import { NDKKind } from '@nostr-dev-kit/ndk'
import { useSubscribe } from '@/hooks/useSubscribe'
import { unixNow } from '@/utils/time'
import { ProfileCardFull } from './ProfileCard'

const ProfileActionModal = () => {
  const { profileAction, setProfileAction } = useContext(AppContext)
  const handleClickCloseModal = useCallback(() => {
    setProfileAction(undefined)
  }, [setProfileAction])

  const filter = useMemo(() => {
    if (!profileAction?.hexpubkey) return
    return {
      kinds: [NDKKind.Text],
      authors: [profileAction?.hexpubkey],
      until: unixNow(),
      limit: 30,
    }
  }, [profileAction?.hexpubkey])

  const [events, fetchMore] = useSubscribe(filter)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <Box className="relative max-h-full flex rounded-2xl overflow-hidden p-0.5 bg-gradient-primary">
      <IconButton
        className="!absolute top-4 right-4 z-10 !bg-[#0000001f]"
        size="small"
        onClick={handleClickCloseModal}
      >
        <Close />
      </IconButton>
      <Paper className="relative w-full overflow-y-auto !rounded-2xl" ref={ref}>
        <ProfileCardFull hexpubkey={profileAction?.hexpubkey} />
        <Divider />
        <EventList events={events} onFetchMore={fetchMore} showComments={true} parentRef={ref} />
      </Paper>
    </Box>
  )
}

export default ProfileActionModal
