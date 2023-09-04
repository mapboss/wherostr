'use client'
import TextNote from '@/components/displays/TextNote'
import ProfileChip from '@/components/ProfileChip'
import { Box, Card, CardContent, Divider } from '@mui/material'
import { useUserProfile, } from '@snort/system-react'
import { TaggedNostrEvent } from '@snort/system'

const ShortTextNoteCard = ({ event }: { event: TaggedNostrEvent }) => {
  const user = useUserProfile(event.pubkey)
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
