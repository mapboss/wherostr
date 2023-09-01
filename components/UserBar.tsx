'use client'
import { AccountContext } from '@/contexts/AccountContext'
import { Avatar } from '@mui/material'
import { useContext } from 'react'

const UserBar = () => {
  const { user } = useContext(AccountContext)
  return (
    <div
      className="p-2 grid items-center"
      style={{
        background: 'linear-gradient(45deg,#dd262b 30%,#f4b400 90%)',
      }}
    >
      <Avatar>W</Avatar>
    </div>
  )
}

export default UserBar
