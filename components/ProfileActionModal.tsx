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
import { useCallback, useContext, useMemo } from 'react'
import { Close } from '@mui/icons-material'
import { AppContext } from '@/contexts/AppContext'
import { NostrContext } from '@/contexts/NostrContext'
import usePromise from 'react-use-promise'
import { NDKKind, NDKUser } from '@nostr-dev-kit/ndk'
import TextNote from './TextNote'

const ProfileCard = ({ user }: { user: NDKUser }) => {
  const displayName = useMemo(
    () => user?.profile?.displayName || user?.profile?.name || user?.npub,
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
              content: user.profile?.about,
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
  const { ndk } = useContext(NostrContext)
  const [events] = usePromise(async () => {
    if (ndk && profileAction?.user) {
      const events = Array.from(
        await ndk.fetchEvents({
          kinds: [NDKKind.Text, NDKKind.Repost],
          authors: [profileAction.user.hexpubkey],
          limit: 50,
        }),
      )
      return events
    }
  }, [ndk])
  const handleClickCloseModal = useCallback(() => {
    setProfileAction(undefined)
  }, [setProfileAction])
  return (
    profileAction && (
      <Box className="max-h-full flex rounded-2xl overflow-hidden p-0.5 background-gradient">
        <Paper className="relative w-full overflow-y-auto !rounded-2xl">
          <ProfileCard user={profileAction.user} />
          <IconButton
            className="!absolute top-3 right-4 !bg-[#0000001f]"
            size="small"
            onClick={handleClickCloseModal}
          >
            <Close />
          </IconButton>
          <Divider />
          <EventList events={events} />
        </Paper>
      </Box>
    )
  )
}

export default ProfileActionModal
