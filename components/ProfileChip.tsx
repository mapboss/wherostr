'use client'
import { Avatar, Box, Typography } from '@mui/material'
import { MetadataCache } from '@snort/system'
import { useMemo } from 'react'

const ProfileChip = ({ user }: { user: MetadataCache }) => {
  const name = useMemo(
    () => user?.display_name || user?.name || user?.npub,
    [user],
  )
  return (
    <Box className="flex overflow-hidden">
      <Avatar className="border-2" src={user?.picture} />
      <Box className="flex flex-col pl-2 max-w-xs overflow-hidden">
        <Typography
          className="overflow-hidden whitespace-nowrap text-ellipsis"
          variant="subtitle2"
        >
          {name}
        </Typography>
        <Typography
          className="overflow-hidden whitespace-nowrap text-ellipsis"
          variant="caption"
        >
          {user?.nip05}
        </Typography>
      </Box>
    </Box>
  )
}

export default ProfileChip
