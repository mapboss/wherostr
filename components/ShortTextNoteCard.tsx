'use client'
import NoteActionBar from '@/components/NoteActionBar'
import ProfileChip from '@/components/ProfileChip'
import TextNote from '@/components/TextNote'
import TimeFromNow from '@/components/TimeFromNow'
import {
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  Typography,
} from '@mui/material'
import { useUserProfile } from '@snort/system-react'
import { TaggedNostrEvent } from '@snort/system'
import { useMemo } from 'react'
import { MoreHorizOutlined } from '@mui/icons-material'

const ShortTextNoteCard = ({ event }: { event: TaggedNostrEvent }) => {
  const user = useUserProfile(event.pubkey)
  const createdDate = useMemo(() => new Date(event.created_at * 1000), [event])
  return (
    <Card className="!rounded-none">
      {user && (
        <Box className="px-4 pt-3 flex items-center gap-2 text-contrast-secondary">
          <ProfileChip user={user} />
          <Box className="grow flex justify-end shrink-0">
            <Typography variant="caption">
              <TimeFromNow date={createdDate} />
            </Typography>
          </Box>
          <IconButton className="!text-contrast-secondary" size="small">
            <MoreHorizOutlined />
          </IconButton>
        </Box>
      )}
      <Box className="flex">
        <CardContent className="flex-1 !pt-3 !pb-0 overflow-hidden">
          <TextNote event={event} />
          <Box className="mt-2">
            <NoteActionBar event={event} />
          </Box>
        </CardContent>
      </Box>
      <Divider className="!mt-3" />
    </Card>
  )
}

export default ShortTextNoteCard
