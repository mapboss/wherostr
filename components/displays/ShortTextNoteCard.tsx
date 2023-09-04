'use client'
import TextNote from '@/components/displays/TextNote'
import ProfileChip from '@/components/ProfileChip'
import { NostrContext } from '@/contexts/NostrContext'
import { Box, Card, CardContent, Divider } from '@mui/material'
import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk'
import { useContext, useEffect, useState } from 'react'

const ShortTextNoteCard = ({ event }: { event: NDKEvent }) => {
  const { ndk } = useContext(NostrContext)
  const [user, setUser] = useState<NDKUser | undefined>(undefined)
  useEffect(() => {
    if (ndk && event) {
      const user = ndk.getUser({
        hexpubkey: event.pubkey,
      })
      user.fetchProfile().then(() => {
        setUser(user)
      })
    }
  }, [ndk, event])
  return (
    <Card className="!rounded-none pt-2">
      {user && (
        <Box className="px-4 py-2">
          <ProfileChip
            className="text-contrast-secondary"
            user={user}
            showActions
          />
        </Box>
      )}
      <Box className="flex">
        <CardContent className="flex-1 !py-2 overflow-hidden">
          <TextNote event={event} />
        </CardContent>
      </Box>
      <Divider className="!mt-2" />
    </Card>
  )
}

export default ShortTextNoteCard
