'use client'
import { AppContext, ProfileActionType } from '@/contexts/AppContext'
import { Avatar, Box, Typography } from '@mui/material'
import { NDKUser } from '@nostr-dev-kit/ndk'
import { useCallback, useContext, useMemo } from 'react'

const ProfileChip = ({
  user,
  showName = true,
}: {
  user?: NDKUser | null
  showName?: boolean
}) => {
  const { setProfileAction } = useContext(AppContext)
  const displayName = useMemo(
    () =>
      user?.profile?.displayName ||
      user?.profile?.name ||
      user?.npub.substring(0, 12),
    [user],
  )
  const handleClickProfile = useCallback(() => {
    if (!user?.hexpubkey) return
    setProfileAction({
      type: ProfileActionType.View,
      hexpubkey: user?.hexpubkey,
    })
  }, [setProfileAction, user?.hexpubkey])

  return (
    <Box
      className="flex overflow-hidden cursor-pointer hover:underline"
      onClick={user ? handleClickProfile : undefined}
    >
      <Avatar className="border-2" src={user?.profile?.image} />
      {showName && (
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
      )}
    </Box>
  )
}

export default ProfileChip
