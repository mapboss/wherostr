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
import { useContext, useMemo } from 'react'
import { MoreVert } from '@mui/icons-material'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { NostrContext } from '@/contexts/NostrContext'
import usePromise from 'react-use-promise'

const ShortTextNoteCard = ({
  event,
  action = true,
  relatedNoteVariant = 'fraction',
}: {
  event: NDKEvent
  action?: boolean
  relatedNoteVariant?: 'full' | 'fraction' | 'link'
}) => {
  const { ndk } = useContext(NostrContext)
  const [user] = usePromise(async () => {
    if (ndk && event) {
      const user = ndk.getUser({
        hexpubkey: event.pubkey,
      })
      await user.fetchProfile()
      return user
    }
  }, [ndk, event])
  const createdDate = useMemo(
    () => (event.created_at ? new Date(event.created_at * 1000) : undefined),
    [event],
  )
  return (
    <Card className="!rounded-none">
      {user && (
        <Box className="px-4 pt-3 flex items-center gap-2 text-contrast-secondary">
          <ProfileChip user={user} />
          {createdDate && (
            <Box className="grow flex justify-end shrink-0">
              <Typography variant="caption">
                <TimeFromNow date={createdDate} />
              </Typography>
            </Box>
          )}
          {action && (
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          )}
        </Box>
      )}
      <Box className="flex">
        <CardContent className="flex-1 !pt-3 !pb-0 overflow-hidden">
          <TextNote event={event} relatedNoteVariant={relatedNoteVariant} />
          {action && (
            <Box className="mt-2">
              <NoteActionBar event={event} />
            </Box>
          )}
        </CardContent>
      </Box>
      <Divider className="!mt-3" />
    </Card>
  )
}

export default ShortTextNoteCard
