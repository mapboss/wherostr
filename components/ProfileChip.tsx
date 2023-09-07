'use client'
import { Avatar, Box, Typography } from '@mui/material'
import { NDKUser } from '@nostr-dev-kit/ndk'
import { useMemo } from 'react'

const ProfileChip = ({ user }: { user: NDKUser }) => {
  const displayName = useMemo(
    () => user?.profile?.displayName || user?.profile?.name || user?.npub,
    [user],
  )
  return (
    <Box className="flex overflow-hidden">
      <Avatar className="border-2" src={user?.profile?.image} />
      <Box className="flex flex-col pl-2 max-w-xs overflow-hidden">
        <Typography
          className="overflow-hidden whitespace-nowrap text-ellipsis"
          variant="subtitle2"
        >
          {displayName}
        </Typography>
        <Typography
          className="overflow-hidden whitespace-nowrap text-ellipsis"
          variant="caption"
        >
          {user?.profile?.nip05}
        </Typography>
      </Box>
    </Box>
  )
}

export default ProfileChip
