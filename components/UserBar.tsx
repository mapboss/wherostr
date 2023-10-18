'use client'
import { Login, Logout } from '@mui/icons-material'
import { Box, IconButton } from '@mui/material'
import { useCallback, useMemo } from 'react'
import ProfileChip from '@/components/ProfileChip'
import classNames from 'classnames'
import { useAccount } from '@/hooks/useAccount'
import { LoadingButton } from '@mui/lab'

const UserBar = ({ className }: { className?: string }) => {
  const { user, signing, signIn, signOut } = useAccount()
  const signedIn = useMemo(() => {
    return !!user
  }, [user])
  const handleClickSignIn = useCallback(() => {
    signIn()
  }, [signIn])
  const handleClickSignOut = useCallback(() => {
    signOut()
  }, [signOut])
  return (
    <Box
      className={classNames(
        'grid items-center rounded-bl-2xl',
        { 'bg-gradient-primary': signedIn },
        className,
      )}
    >
      {user?.hexpubkey ? (
        <Box className="flex items-center gap-2">
          <ProfileChip hexpubkey={user?.hexpubkey} />
          <IconButton size="small" onClick={handleClickSignOut}>
            <Logout />
          </IconButton>
        </Box>
      ) : (
        <LoadingButton
          loading={signing}
          className="bg-gradient-primary"
          variant="contained"
          onClick={handleClickSignIn}
          startIcon={<Login />}
          loadingPosition="start"
        >
          Login
        </LoadingButton>
      )}
    </Box>
  )
}

export default UserBar
