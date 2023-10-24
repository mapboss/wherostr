import { Box, LinearProgress, Typography } from '@mui/material'
import { FC, useMemo } from 'react'
import { nip19 } from 'nostr-tools'
import { useUserProfile } from '@/hooks/useUserProfile'
import { ProfileCardFull } from './ProfileCard'

export interface NostrPubkeyComponentProps {
  data: string
}
export const NostrPubkeyComponent: FC<NostrPubkeyComponentProps> = ({
  data,
}) => {
  const naddr = useMemo(() => nip19.npubEncode(data), [data])
  const user = useUserProfile(data)

  if (!user) {
    return <LinearProgress />
  }

  return (
    <Box mx={2} overflow="hidden">
      <ProfileCardFull hexpubkey={data} />
    </Box>
  )
}
