'use client'
import {
  AppContext,
  EventActionType,
  ProfileActionType,
} from '@/contexts/AppContext'
import { Avatar, AvatarProps, Box, Typography } from '@mui/material'
import { ReactNode, useCallback, useContext, useMemo } from 'react'
import ProfileValidBadge from './ProfileValidBadge'
import { useUserProfile } from '@/hooks/useUserProfile'
import classNames from 'classnames'

export interface ProfileChipProps {
  className?: string
  hexpubkey?: string | string[]
  eventActionType?: EventActionType
  showName?: boolean
  showNip5?: boolean
  nameAdornment?: ReactNode
  onClick?: (hexpubkey: string) => void | boolean
}

const ProfileChip = ({
  className,
  hexpubkey,
  eventActionType,
  showName = true,
  showNip5 = true,
  nameAdornment,
  onClick,
}: ProfileChipProps) => {
  const userLeft = useUserProfile(
    typeof hexpubkey === 'string' ? hexpubkey : hexpubkey?.[0],
  )
  // const userRight = useUserProfile(hexpubkey?.[1])
  const { setProfileAction } = useContext(AppContext)
  const displayName = useMemo(
    () =>
      userLeft?.profile?.displayName ||
      userLeft?.profile?.name ||
      userLeft?.profile?.username ||
      userLeft?.npub?.substring(0, 12),
    [userLeft],
  )
  const handleClickProfile = useCallback(() => {
    if (!userLeft?.hexpubkey) return
    if (onClick && onClick(userLeft?.hexpubkey) === false) {
      return
    }
    setProfileAction({
      type: ProfileActionType.View,
      hexpubkey: userLeft?.hexpubkey,
    })
  }, [userLeft?.hexpubkey, onClick, setProfileAction])

  return (
    <Box
      className={classNames(
        className,
        'relative min-w-[40px] flex cursor-pointer hover:underline items-center',
      )}
      onClick={userLeft ? handleClickProfile : undefined}
    >
      <Box className="relative">
        <Avatar
          className="min-w-[40px] border-2"
          src={userLeft?.profile?.image}
        />
        <ProfileValidBadge
          className="absolute top-0 right-0 w-4 h-4"
          user={userLeft}
        />
      </Box>
      {showName && (
        <Box className="flex flex-col pl-3 overflow-hidden">
          <Box className="flex">
            <Typography
              className="overflow-hidden whitespace-nowrap text-ellipsis text-contrast-primary"
              variant="subtitle2"
            >
              {displayName}
            </Typography>
            {nameAdornment}
          </Box>
          {showNip5 && (
            <Typography
              className="overflow-hidden whitespace-nowrap text-ellipsis text-contrast-secondary"
              variant="caption"
            >
              {userLeft?.profile?.nip05}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default ProfileChip
