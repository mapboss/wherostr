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
import { NDKKind } from '@nostr-dev-kit/ndk'
import TextNote from './TextNote'
import { useSubscribe } from '@/hooks/useSubscribe'
import { unixNow } from '@/utils/time'
import ProfileValidBadge from './ProfileValidBadge'
import { useUserProfile } from '@/hooks/useUserProfile'

const ProfileCard = ({ hexpubkey }: { hexpubkey?: string }) => {
  const user = useUserProfile(hexpubkey)
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
            <Box className="flex items-center">
              <Typography
                className="overflow-hidden whitespace-nowrap text-ellipsis"
                variant="h6"
              >
                {displayName}
              </Typography>
              <ProfileValidBadge className="ml-2" user={user} />
            </Box>
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
    if (!profileAction?.hexpubkey) return
    return {
      kinds: [NDKKind.Text],
      authors: [profileAction?.hexpubkey],
      until: unixNow(),
      limit: 10,
    }
  }, [profileAction?.hexpubkey])

  const [events, fetchMore] = useSubscribe(filter)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <Box className="relative max-h-full flex rounded-2xl overflow-hidden p-0.5 background-gradient">
      <IconButton
        className="!absolute top-4 right-4 z-10 !bg-[#0000001f]"
        size="small"
        onClick={handleClickCloseModal}
      >
        <Close />
      </IconButton>
      <Paper className="relative w-full overflow-y-auto !rounded-2xl" ref={ref}>
        <ProfileCard hexpubkey={profileAction?.hexpubkey} />
        <Divider />
        <EventList events={events} onFetchMore={fetchMore} parentRef={ref} />
      </Paper>
    </Box>
  )
}

export default ProfileActionModal
