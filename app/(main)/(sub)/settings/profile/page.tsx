'use client'

import { ProfileCard } from '@/components/ProfileCard'
import { useUser } from '@/hooks/useAccount'
import { Typography } from '@mui/material'

export default function Page() {
  const user = useUser()
  return (
    <>
      <ProfileCard hexpubkey={user?.hexpubkey} />
      <Typography variant="h4">Coming soon</Typography>
    </>
  )
}
