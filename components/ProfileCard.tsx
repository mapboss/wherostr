import { useUserProfile } from '@/hooks/useUserProfile'
import { Avatar, Box, Typography } from '@mui/material'
import { NDKUser } from '@nostr-dev-kit/ndk'
import classNames from 'classnames'
import { useMemo } from 'react'
import ProfileValidBadge from './ProfileValidBadge'
import TextNote from './TextNote'

export const ProfileCard = ({
  hexpubkey,
  showAbout,
  onClick,
}: {
  hexpubkey?: string
  showAbout?: boolean
  onClick?: (user?: NDKUser) => void
}) => {
  const user = useUserProfile(hexpubkey)
  const displayName = useMemo(
    () =>
      user?.profile?.displayName ||
      user?.profile?.name ||
      user?.profile?.username ||
      user?.npub.substring(0, 12),
    [user],
  )

  const clickable = useMemo(() => !!onClick, [onClick])

  return (
    <Box>
      <Box
        className={`aspect-[5/2] bg-cover bg-center${
          user?.profile?.banner ? '' : ' opacity-70 bg-gradient-primary'
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
        <Box
          onClick={() => onClick?.(user)}
          className={classNames('flex', {
            'cursor-pointer [&:hover_h6]:underline [&:hover_p]:underline':
              clickable,
          })}
        >
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
        {showAbout !== false && (
          <Box className="py-3 text-contrast-secondary">
            <TextNote
              event={{
                content: user?.profile?.about,
              }}
              textVariant="subtitle2"
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export const ProfileCardFull = ({
  hexpubkey,
  showAbout,
  onClick,
}: {
  hexpubkey?: string
  showAbout?: boolean
  onClick?: (user?: NDKUser) => void
}) => {
  const user = useUserProfile(hexpubkey)
  const displayName = useMemo(
    () =>
      user?.profile?.displayName ||
      user?.profile?.name ||
      user?.profile?.username ||
      user?.npub.substring(0, 12),
    [user],
  )

  const clickable = useMemo(() => !!onClick, [onClick])

  return (
    <Box>
      <Box
        className={`aspect-[5/2] bg-cover bg-center${
          user?.profile?.banner ? '' : ' opacity-70 bg-gradient-primary'
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
        <Box
          onClick={() => onClick?.(user)}
          className={classNames('flex flex-col sm:flex-row', {
            'cursor-pointer [&:hover_h6]:underline [&:hover_p]:underline':
              clickable,
          })}
        >
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
        {showAbout !== false && (
          <Box className="py-3 text-contrast-secondary">
            <TextNote
              event={{
                content: user?.profile?.about,
              }}
              textVariant="subtitle2"
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}
