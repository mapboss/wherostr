import { useUserProfile } from '@/hooks/useUserProfile'
import {
  Avatar,
  Box,
  Button,
  // Fab,
  IconButton,
  Menu,
  Typography,
} from '@mui/material'
import { NDKUser } from '@nostr-dev-kit/ndk'
import classNames from 'classnames'
import { useCallback, useMemo, useState } from 'react'
import ProfileValidBadge from './ProfileValidBadge'
import TextNote from './TextNote'
import { useFollowing, useUser } from '@/hooks/useAccount'
import { LoadingButton } from '@mui/lab'
import {
  // Bolt,
  BoltRounded,
  Check,
  CopyAll,
  Link as LinkIcon,
  PersonAddOutlined,
  PersonRemoveOutlined,
  ExpandMoreOutlined,
} from '@mui/icons-material'
import copy from 'copy-to-clipboard'

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
              className="overflow-hidden whitespace-nowrap text-ellipsis text-contrast-secondary"
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

let copyStateTimeout: NodeJS.Timeout
export const ProfileCardFull = ({
  hexpubkey,
  onClick,
}: {
  hexpubkey?: string
  onClick?: (user?: NDKUser) => void
}) => {
  const [followingMenuAnchorEl, setFollowingMenuAnchorEl] =
    useState<HTMLElement | null>(null)
  const account = useUser()
  const [copied, setCopied] = useState(false)
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

  const handleCopy = useCallback(() => {
    user?.npub && copy(user.npub)
    setCopied(true)
    clearTimeout(copyStateTimeout)
    copyStateTimeout = setTimeout(() => {
      setCopied(false)
    }, 3000)
  }, [user?.npub])
  const handleClickFollowing = (event: React.MouseEvent<HTMLElement>) => {
    setFollowingMenuAnchorEl(event.currentTarget)
  }
  const handleCloseFollowingMenu = useCallback(
    () => setFollowingMenuAnchorEl(null),
    [],
  )
  const handleClickFollow = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      await follow(user)
    } finally {
      setLoading(false)
    }
  }, [follow, user])
  const handleClickUnfollow = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      await unfollow(user)
      setFollowingMenuAnchorEl(null)
    } finally {
      setLoading(false)
    }
  }, [unfollow, user])

  return (
    <Box>
      <Box
        className={`relative aspect-[5/2] bg-cover bg-center`}
        style={
          user?.profile?.banner
            ? {
                backgroundImage: `url(${user?.profile?.banner})`,
              }
            : undefined
        }
      >
        {!user?.profile?.banner && (
          <Box className="absolute inset-0 opacity-70 bg-gradient-primary" />
        )}
      </Box>
      <Box className="px-3">
        <Box className="flex justify-between gap-2">
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
            <Box className="flex flex-col pt-3 sm:pl-2 max-w-xs overflow-hidden">
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
                className="overflow-hidden whitespace-nowrap text-ellipsis text-contrast-secondary"
                variant="body2"
              >
                {user?.profile?.nip05}
              </Typography>
            </Box>
          </Box>
          <Box className="pt-3">
            {account && !itsYou && (
              <>
                {/* <Fab
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
              </Fab> */}
                {!isFollowing ? (
                  <LoadingButton
                    loading={loading}
                    loadingPosition="start"
                    color="secondary"
                    variant="contained"
                    startIcon={<PersonAddOutlined />}
                    onClick={handleClickFollow}
                  >
                    Follow
                  </LoadingButton>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="inherit"
                      endIcon={<ExpandMoreOutlined />}
                      onClick={handleClickFollowing}
                    >
                      Following
                    </Button>
                    <Menu
                      className="min-w-"
                      anchorEl={followingMenuAnchorEl}
                      open={!!followingMenuAnchorEl}
                      onClose={handleCloseFollowingMenu}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                    >
                      <LoadingButton
                        className="!rounded-none"
                        color="error"
                        loading={loading}
                        loadingPosition="start"
                        startIcon={<PersonRemoveOutlined />}
                        onClick={handleClickUnfollow}
                      >
                        Unfollow
                      </LoadingButton>
                    </Menu>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
        <Box className="py-3 text-contrast-secondary">
          {user?.npub && (
            <Typography variant="subtitle2">
              {user.npub.substring(0, 12) +
                '...' +
                user.npub.substring(user.npub.length - 12)}
              <IconButton
                className="!ml-2"
                size="small"
                color="secondary"
                onClick={handleCopy}
              >
                {!copied ? (
                  <CopyAll />
                ) : (
                  <Check sx={{ color: 'success.main' }} />
                )}
              </IconButton>
            </Typography>
          )}
          {user?.profile?.website && (
            <Typography
              variant="subtitle2"
              className="cursor-pointer"
              component="a"
              href={user.profile.website}
              target="_blank"
            >
              <LinkIcon />{' '}
              <span className="hover:underline">
                {user.profile.website.replace(/http(s)?:\/\//, '')}
              </span>
            </Typography>
          )}
          {user?.profile?.lud16 || user?.profile?.lud06 ? (
            <Typography variant="subtitle2">
              <BoltRounded sx={{ color: 'primary.main' }} />{' '}
              <span>
                {user.profile.lud16 ||
                  (user.profile.lud06
                    ? user.profile.lud06.substring(0, 12) +
                      '...' +
                      user.profile.lud06.substring(
                        user.profile.lud06.length - 12,
                      )
                    : '')}
              </span>
            </Typography>
          ) : undefined}
        </Box>
        {user?.profile?.about && (
          <Box className="py-3 text-contrast-secondary">
            <TextNote
              event={{ content: user.profile.about }}
              textVariant="subtitle2"
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}
