'use client'
import { AppContext, ProfileActionType } from '@/contexts/AppContext'
import { Avatar, AvatarProps, Box, Typography } from '@mui/material'
import { useCallback, useContext, useMemo } from 'react'
import ProfileValidBadge from './ProfileValidBadge'
import { useUserProfile } from '@/hooks/useUserProfile'

const ProfileChip = ({
  hexpubkey,
  showName = true,
  showNip5 = true,
  onClick,
}: {
  hexpubkey?: string
  showName?: boolean
  showNip5?: boolean
  onClick?: (hexpubkey: string) => void | boolean
}) => {
  const user = useUserProfile(hexpubkey)
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
    if (!hexpubkey) return
    if (onClick && onClick(hexpubkey) === false) {
      return
    }
    setProfileAction({
      type: ProfileActionType.View,
      hexpubkey: hexpubkey,
    })
  }, [hexpubkey, onClick, setProfileAction])

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
