'use client'
import { CheckCircle, Report } from '@mui/icons-material'
import { Box } from '@mui/material'
import { NDKUser } from '@nostr-dev-kit/ndk'
import classNames from 'classnames'
import { useMemo } from 'react'

const ProfileValidBadge = ({
  className,
  user,
}: {
  className?: string
  user?: NDKUser | null
}) => {
  const validNip05 = useMemo(
    () =>
      user?.profile?.validNip05 === '1'
        ? true
        : user?.profile?.validNip05 === '0'
        ? false
        : undefined,
    [user?.profile?.validNip05],
  )
  return (
    validNip05 !== undefined && (
      <Box className={classNames(className, 'inline-block')}>
        <Box
          className={classNames(
            'w-full h-full rounded-full flex items-center justify-center',
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
      </Box>
    )
  )
}

export default ProfileValidBadge
