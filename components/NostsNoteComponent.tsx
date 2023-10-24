import { Box, LinearProgress, Paper } from '@mui/material'
import { FC, useMemo } from 'react'
import { nip19 } from 'nostr-tools'
import { NDKFilter } from '@nostr-dev-kit/ndk'
import { useSubscribe } from '@/hooks/useSubscribe'
import { ShortTextNotePane } from './EventActionModal'

export interface NostrNoteComponentProps {
  data: string
}
export const NostrNoteComponent: FC<NostrNoteComponentProps> = ({ data }) => {
  const naddr = useMemo(() => nip19.noteEncode(data), [data])

  const filter = useMemo<NDKFilter>(() => {
    return {
      ids: [data],
    }
  }, [data])
  const [events] = useSubscribe(filter, true)
  const event = useMemo(() => events?.[0], [events])

  if (!event) {
    return <LinearProgress />
  }

  return <ShortTextNotePane event={event} comments />
}
