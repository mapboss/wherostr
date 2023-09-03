'use client'
import { NostrContext } from '@/contexts/NostrContext'
import { Box, Card, CardContent, Divider, Typography } from '@mui/material'
import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk'
import { useContext, useEffect, useState } from 'react'
import ProfileChip from '@/components/ProfileChip'

const ShortTextNoteCard = ({ event }: { event: NDKEvent }) => {
  const { ndk } = useContext(NostrContext)
  const [profile, setProfile] = useState<NDKUserProfile | undefined>(undefined)
  useEffect(() => {
    if (ndk && event) {
      const user = ndk.getUser({
        hexpubkey: event.pubkey,
      })
      user.fetchProfile().then(() => {
        setProfile(user.profile)
      })
    }
  }, [ndk, event])
  return (
    <Card className="!rounded-none pt-2">
      <Box className="flex">
        <CardContent className="flex-1 !py-2">
          {/* <div
            className="w-20 h-20 bg-cover rounded-lg float-right"
            style={{
              backgroundImage:
                'url(https://primal.b-cdn.net/media-cache?s=o&a=1&u=https%3A%2F%2Fm.primal.net%2FHKHZ.jpg)',
            }}
          /> */}
          <Typography variant="body2" component="p">
            {event.content}
          </Typography>
        </CardContent>
      </Box>
      {profile && (
        <Box className="px-4 py-2">
          <ProfileChip className="text-neutral-400" profile={profile} />
        </Box>
      )}
      <Divider className="!mt-2" />
    </Card>
  )
}

export default ShortTextNoteCard
