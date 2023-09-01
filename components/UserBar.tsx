'use client'
import { AccountContext } from '@/contexts/AccountContext'
import { Login, Logout } from '@mui/icons-material'
import { Avatar, Button, IconButton, Typography } from '@mui/material'
import { NDKUserProfile } from '@nostr-dev-kit/ndk'
import { useCallback, useContext, useMemo } from 'react'

const UserChip = ({ profile }: { profile: NDKUserProfile }) => {
  const name = useMemo(() => profile.displayName || profile.name, [profile])
  return (
    <div className="flex">
      <Avatar alt={name} src={profile.image} />
      <div className="flex flex-col pl-2">
        <Typography variant="subtitle2">{name}</Typography>
        <Typography variant="caption">{profile.nip05}</Typography>
      </div>
    </div>
  )
}

const UserBar = () => {
  const { user, signIn, signOut } = useContext(AccountContext)
  const signedIn = useMemo(() => {
    return !!user?.profile
  }, [user])
  const handleClickSignIn = useCallback(() => {
    signIn()
  }, [signIn])
  const handleClickSignOut = useCallback(() => {
    signOut()
  }, [signOut])
  return (
    <div
      className={`grid items-center p-3 rounded-bl-3xl h-16 ${
        signedIn ? 'background-gradient' : ''
      }`}
    >
      {user?.profile ? (
        <div className="flex items-center">
          <UserChip profile={user.profile} />
          <IconButton
            classes={{ root: '!ml-2' }}
            color="error"
            size="small"
            onClick={handleClickSignOut}
          >
            <Logout />
          </IconButton>
        </div>
      ) : (
        <Button
          classes={{ root: 'background-gradient !rounded-full' }}
          variant="contained"
          onClick={handleClickSignIn}
          endIcon={<Login />}
        >
          Sign In
        </Button>
      )}
    </div>
  )
}

export default UserBar
