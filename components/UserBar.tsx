'use client'
import { AccountContext } from '@/contexts/AccountContext'
import { Login, Logout } from '@mui/icons-material'
import { Box, Button, IconButton } from '@mui/material'
import { useCallback, useContext, useMemo } from 'react'
import ProfileChip from '@/components/ProfileChip'
import classNames from 'classnames'

const UserBar = ({ className }: { className?: string }) => {
  const { user, signIn, signOut } = useContext(AccountContext)
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
        `grid items-center rounded-bl-2xl`,
        { 'bg-gradient-primary': signedIn },
        className,
      )}
    >
      {user ? (
        <Box className="flex items-center gap-2">
          <ProfileChip user={user} />
          <IconButton size="small" onClick={handleClickSignOut}>
            <Logout />
          </IconButton>
        </Box>
      ) : (
        <Button
          className="bg-gradient-primary"
          variant="contained"
          onClick={handleClickSignIn}
          startIcon={<Login />}
        >
          Login
        </Button>
      )}
    </Box>
  )
}

export default UserBar
