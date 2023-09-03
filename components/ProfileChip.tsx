import { Avatar, Typography } from '@mui/material'
import { NDKUserProfile } from '@nostr-dev-kit/ndk'
import { useMemo } from 'react'

const ProfileChip = ({
  className,
  profile,
}: {
  className?: string
  profile: NDKUserProfile
}) => {
  const name = useMemo(() => profile.displayName || profile.name, [profile])
  return (
    <div className={`flex ${className}`}>
      <Avatar src={profile.image} />
      <div className="flex flex-col pl-2 max-w-xs">
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
          {profile.nip05}
        </Typography>
      </div>
    </div>
  )
}

export default ProfileChip
