'use client'
import { Avatar, AvatarProps } from '@mui/material'
import { useUserProfile } from '@/hooks/useUserProfile'

const ProfileAvatar = ({
  hexpubkey,
  ...props
}: { hexpubkey?: string } & AvatarProps) => {
  const user = useUserProfile(hexpubkey)

  return <Avatar src={user?.profile?.image} {...props} />
}

export default ProfileAvatar
