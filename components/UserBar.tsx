'use client'
import { AccountContext } from '@/contexts/AccountContext'
import { Button } from '@mui/material'
import { useCallback, useContext } from 'react'

const UserBar = () => {
  const { user, signIn, signOut } = useContext(AccountContext)
  const handleClickSignIn = useCallback(() => {
    signIn()
  }, [signIn])
  const handleClickSignOut = useCallback(() => {
    signOut()
  }, [signOut])
  return (
    <div
      className="grid items-center p-3 rounded-bl-3xl"
      style={{
        background: 'linear-gradient(45deg,#dd262b 30%,#f4b400 90%)',
      }}
    >
      {user ? (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleClickSignOut}
        >
          Sign Out
        </Button>
      ) : (
        <Button variant="contained" onClick={handleClickSignIn}>
          Sign In
        </Button>
      )}
    </div>
  )
}

export default UserBar
