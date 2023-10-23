import { useUserProfile } from '@/hooks/useUserProfile'
import {
  Avatar,
  Box,
  Fab,
  FabProps,
  Icon,
  IconButton,
  Typography,
  styled,
} from '@mui/material'
import { NDKUser } from '@nostr-dev-kit/ndk'
import classNames from 'classnames'
import { useMemo, useState } from 'react'
import ProfileValidBadge from './ProfileValidBadge'
import TextNote from './TextNote'
import { useFollowing, useUser } from '@/hooks/useAccount'
import { LoadingButton } from '@mui/lab'
import {
  Bolt,
  BoltRounded,
  CopyAll,
  Link,
  RemoveCircleOutline,
  SubscriptionsSharp,
} from '@mui/icons-material'

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
      <Box className="px-3">
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
  onClick,
}: {
  hexpubkey?: string
  onClick?: (user?: NDKUser) => void
}) => {
  const account = useUser()
  const [loading, setLoading] = useState(false)
  const user = useUserProfile(hexpubkey)
  const [follows, follow, unfollow] = useFollowing()
  const displayName = useMemo(
    () =>
      user?.profile?.displayName ||
      user?.profile?.name ||
      user?.profile?.username ||
      user?.npub.substring(0, 12),
    [user],
  )
  const itsYou = useMemo(
    () => account?.hexpubkey === hexpubkey,
    [account?.hexpubkey, hexpubkey],
  )
  const isFollowing = useMemo(
    () => follows.find((d) => d.hexpubkey === hexpubkey),
    [follows, hexpubkey],
  )
  const clickable = useMemo(() => !!onClick, [onClick])

  return (
    <Box>
      <Box
        className={`relative aspect-[5/2] bg-cover bg-center${
          user?.profile?.banner ? '' : ' opacity-70 bg-gradient-primary'
        }`}
        style={
          user?.profile?.banner
            ? {
                backgroundImage: `url(${user?.profile?.banner})`,
              }
            : undefined
        }
      >
        <Box className="absolute right-2 -bottom-4">
          {!itsYou && (
            <>
              <Fab
                size="small"
                className="!mr-2"
                sx={{
                  color: 'primary.light',
                  bgcolor: 'grey.800',
                  '&:hover': {
                    bgcolor: 'grey.700',
                  },
                }}
              >
                <Bolt />
              </Fab>
              {!isFollowing ? (
                <LoadingButton
                  loading={loading}
                  loadingPosition="start"
                  color="primary"
                  variant="contained"
                  startIcon={<SubscriptionsSharp />}
                  onClick={async () => {
                    if (!user) return
                    try {
                      setLoading(true)
                      await follow(user)
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  Follow
                </LoadingButton>
              ) : (
                <LoadingButton
                  loading={loading}
                  loadingPosition="start"
                  color="inherit"
                  variant="contained"
                  startIcon={<RemoveCircleOutline />}
                  onClick={async () => {
                    if (!user) return
                    try {
                      setLoading(true)
                      await unfollow(user)
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  Unfollow
                </LoadingButton>
              )}
            </>
          )}
        </Box>
      </Box>
      <Box className="px-3">
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
        <Box className="py-3 text-contrast-secondary">
          {user?.npub && (
            <Typography variant="subtitle2">
              {user.npub.substring(0, 12) +
                '...' +
                user.npub.substring(user.npub.length - 12)}
              <IconButton size="small" color="secondary">
                <CopyAll />
              </IconButton>
            </Typography>
          )}
          {user?.profile?.website && (
            <Typography variant="subtitle2" className="cursor-pointer">
              <Link />{' '}
              <span className="hover:underline">{user?.profile?.website}</span>
            </Typography>
          )}
          {user?.profile?.lud16 && (
            <Typography variant="subtitle2" className="cursor-pointer">
              <BoltRounded sx={{ color: 'primary.main' }} />{' '}
              <span className="hover:underline">{user?.profile?.lud16}</span>
            </Typography>
          )}
        </Box>
        {user?.profile?.about && (
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
