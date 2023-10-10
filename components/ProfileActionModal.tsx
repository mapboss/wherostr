'use client'
import EventList from '@/components/EventList'
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Paper,
  Typography,
} from '@mui/material'
import { useCallback, useContext, useMemo, useRef } from 'react'
import { Close } from '@mui/icons-material'
import { AppContext } from '@/contexts/AppContext'
import { NDKKind, NDKUser } from '@nostr-dev-kit/ndk'
import TextNote from './TextNote'
import { useSubscribe } from '@/hooks/useSubscribe'
import { MILLISECONDS, unixNow } from '@/utils/time'

const ProfileCard = ({ user }: { user?: NDKUser }) => {
  const displayName = useMemo(
    () =>
      user?.profile?.displayName ||
      user?.profile?.name ||
      user?.profile?.username ||
      user?.npub.substring(0, 12),
    [user],
  )
  return (
    <Box>
      <Box
        className={`aspect-[5/2] bg-cover bg-center${
          user?.profile?.banner ? '' : ' opacity-70 background-gradient'
        }`}
        style={
          user?.profile?.image
            ? {
                backgroundImage: `url(${user?.profile?.banner})`,
              }
            : undefined
        }
      />
      <Box className="px-4">
        <Box className="flex">
          <Avatar
            className="border-2 !w-36 !h-36 -mt-[72px]"
            src={user?.profile?.image}
          />
          <Box className="flex flex-col pt-3 pl-2 max-w-xs overflow-hidden">
            <Typography
              className="overflow-hidden whitespace-nowrap text-ellipsis"
              variant="h6"
            >
              {displayName}
            </Typography>
            <Typography
              className="overflow-hidden whitespace-nowrap text-ellipsis"
              variant="body2"
            >
              {user?.profile?.nip05}
            </Typography>
          </Box>
        </Box>
        <Box className="py-3 text-contrast-secondary">
          <TextNote
            event={{
              content: user?.profile?.about,
            }}
            textVariant="subtitle2"
          />
        </Box>
      </Box>
    </Box>
  )
}

const ProfileActionModal = () => {
  const { profileAction, setProfileAction } = useContext(AppContext)
  const handleClickCloseModal = useCallback(() => {
    setProfileAction(undefined)
  }, [setProfileAction])

  const filter = useMemo(() => {
    if (!profileAction?.user.hexpubkey) return
    return {
      kinds: [NDKKind.Text],
      authors: [profileAction?.user.hexpubkey],
      until: unixNow(),
      limit: 10,
    }
  }, [profileAction?.user.hexpubkey])

  const [events, fetchMore] = useSubscribe(filter)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <Box className="max-h-full flex rounded-2xl overflow-hidden p-0.5 background-gradient">
      <IconButton
        className="!absolute top-12 right-12 z-10 !bg-[#0000001f]"
        size="small"
        onClick={handleClickCloseModal}
      >
        <Close />
      </IconButton>
      <Paper className="relative w-full overflow-y-auto !rounded-2xl" ref={ref}>
        <ProfileCard user={profileAction?.user} />
        <Divider />
        <EventList events={events} onFetchMore={fetchMore} parentRef={ref} />
      </Paper>
    </Box>
  )
}

export default ProfileActionModal
