'use client'
import { AppContext, ProfileActionType } from '@/contexts/AppContext'
import { CheckCircle, Report } from '@mui/icons-material'
import { Avatar, Box, Typography } from '@mui/material'
import { NDKUser } from '@nostr-dev-kit/ndk'
import classNames from 'classnames'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

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
  const [validNip05, setValidNip05] = useState<boolean>()
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

  useEffect(() => {
    const { validNip05 } = user?.profile || {}
    if (validNip05 === '1') {
      setValidNip05(true)
    } else if (validNip05 === '0') {
      setValidNip05(false)
    } else {
      setValidNip05(undefined)
    }
  }, [user?.profile])

  return (
    <Box
      className="relative min-w-[40px] flex cursor-pointer hover:underline items-center"
      onClick={user ? handleClickProfile : undefined}
    >
      <Box className="relative">
        <Avatar className="min-w-[40px] border-2" src={user?.profile?.image} />
        {typeof validNip05 !== 'undefined' && (
          <Box
            className={classNames(
              'absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center',
              {
                'bg-gradient-primary': validNip05,
                'bg-[black]': !validNip05,
              },
            )}
          >
            {validNip05 === true ? (
              <CheckCircle className="text-[black] flex-1" />
            ) : (
              <Report className="text-error flex-1" />
            )}
          </Box>
        )}
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
