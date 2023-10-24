import { Box, LinearProgress, Typography } from '@mui/material'
import { FC, useMemo } from 'react'
import LiveActivity from './LiveActivity'
import { NDKFilter } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { useStreamRelaySet } from '@/hooks/useNostr'
import { useSubscribe } from '@/hooks/useSubscribe'

export interface NostrAddressComponentProps {
  data: nip19.AddressPointer
}
export const NostrAddressComponent: FC<NostrAddressComponentProps> = ({
  data,
}) => {
  const naddr = useMemo(() => nip19.naddrEncode(data), [data])
  const filter = useMemo<NDKFilter>(() => {
    return {
      kinds: [data.kind],
      authors: [data.pubkey],
      '#d': [data.identifier],
    }
  }, [data])
  const relaySet = useStreamRelaySet()
  const [events] = useSubscribe(filter, true, relaySet)
  const event = useMemo(() => events?.[0], [events])

  if (!event) {
    return <LinearProgress />
  }

  if (event?.kind === 30311) {
    return <LiveActivity naddr={naddr} event={event} />
  }

  return (
    <Typography component="pre" variant="caption">
      {JSON.stringify(event || {}, null, 4)}
    </Typography>
  )
}
