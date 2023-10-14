'use client'
import { AppContext, ProfileActionType } from '@/contexts/AppContext'
import { Avatar, Box, Typography } from '@mui/material'
import { NDKUser } from '@nostr-dev-kit/ndk'
import { useCallback, useContext, useMemo } from 'react'
import ProfileValidBadge from './ProfileValidBadge'

const ProfileChip = ({
  user,
  showName = true,
  showNip5 = true,
  onClick,
}: {
  user?: NDKUser | null
  showName?: boolean
  showNip5?: boolean
  onClick?: (user: NDKUser) => void
}) => {
  const { setProfileAction } = useContext(AppContext)
  const displayName = useMemo(
    () =>
      user?.profile?.displayName ||
      user?.profile?.name ||
      user?.profile?.username ||
      user?.npub?.substring(0, 12),
    [user],
  )
  const handleClickProfile = useCallback(() => {
    if (!user?.hexpubkey) return
    if (onClick) {
      return onClick(user)
    }
    setProfileAction({
      type: ProfileActionType.View,
      hexpubkey: user?.hexpubkey,
    })
  }, [user, onClick, setProfileAction])
  return (
    <Box
      className="relative min-w-[40px] flex cursor-pointer hover:underline items-center"
      onClick={user ? handleClickProfile : undefined}
    >
      <Box className="relative">
        <Avatar className="min-w-[40px] border-2" src={user?.profile?.image} />
        <ProfileValidBadge
          className="absolute top-0 right-0 w-4 h-4"
          user={user}
        />
      </Box>
      {showName && (
        <Box className="flex flex-col pl-2 max-w-xs overflow-hidden">
          <Typography
            className="overflow-hidden whitespace-nowrap text-ellipsis"
            variant="subtitle2"
          >
            {displayName}
          </Typography>
          {showNip5 && (
            <Typography
              className="overflow-hidden whitespace-nowrap text-ellipsis"
              variant="caption"
            >
              {user?.profile?.nip05}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default ProfileChip
