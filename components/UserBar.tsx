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
      className="grid items-center p-3 rounded-bl-lg"
      style={{
        background: 'linear-gradient(45deg, #dd262b 30%, #ffd700 90%)',
      }}
    >
      {user ? (
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={handleClickSignOut}
        >
          Sign Out
        </Button>
      ) : (
        <Button variant="contained" size="small" color='primary' onClick={handleClickSignIn}>
          Sign In
        </Button>
      )}
    </div>
  )
}

export default UserBar
