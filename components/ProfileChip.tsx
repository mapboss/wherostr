import { AccountContext } from '@/contexts/AccountContext'
import { VolumeOffOutlined, VolumeUpOutlined } from '@mui/icons-material'
import { Avatar, Box, Button, IconButton, Typography } from '@mui/material'
import { NDKUser } from '@nostr-dev-kit/ndk'
import { useContext, useMemo } from 'react'

const ProfileChip = ({
  className,
  user,
  showActions = false,
}: {
  className?: string
  user: NDKUser
  showActions?: boolean
}) => {
  const { user: me } = useContext(AccountContext)
  const name = useMemo(
    () => user.profile?.displayName || user.profile?.name,
    [user],
  )
  const isMe = useMemo(() => me?.npub === user.npub, [me, user])
  const settings = useMemo(
    () => ({
      following: false,
      muted: false,
    }),
    [],
  )
  return (
    <Box
      className={`grid grid-flow-col gap-2 items-center justify-between${
        className ? ` ${className}` : ''
      }`}
    >
      <Box className="flex">
        <Avatar className="border-2" src={user.profile?.image} />
        <Box className="flex flex-col pl-2 max-w-xs">
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
            {user.profile?.nip05}
          </Typography>
        </Box>
      </Box>
      {showActions &&
        (isMe ? (
          <Button className="w-20" variant="outlined" size="small" disabled>
            It&apos;s you
          </Button>
        ) : (
          <Box className="grid grid-flow-col gap-2">
            {settings.muted ? (
              <IconButton color="error" size="small">
                <VolumeOffOutlined />
              </IconButton>
            ) : (
              <IconButton size="small">
                <VolumeUpOutlined />
              </IconButton>
            )}
            {settings.following ? (
              <Button
                className="w-20"
                color="primary"
                variant="outlined"
                size="small"
              >
                Following
              </Button>
            ) : (
              <Button
                className="w-20"
                color="primary"
                variant="contained"
                size="small"
              >
                Follow
              </Button>
            )}
          </Box>
        ))}
    </Box>
  )
}

export default ProfileChip
