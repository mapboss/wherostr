import { FC, useCallback, useState } from 'react'
import { LoadingButton } from '@mui/lab'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { useNDK, useStreamRelaySet } from '@/hooks/useNostr'

export interface DeleteButtonProps {
  label?: string
  event?: NDKEvent
  onDelete?: () => void
}
export const DeleteButton: FC<DeleteButtonProps> = ({
  label = 'Delete',
  event,
  onDelete,
}) => {
  const ndk = useNDK()
  const relaySet = useStreamRelaySet()
  const [loading, setLoading] = useState(false)

  const handleDelete = useCallback(async () => {
    if (!event) return
    try {
      if (!confirm('Are you sure to delete ?')) return
      setLoading(true)
      const ev = new NDKEvent(ndk)
      ev.kind = NDKKind.EventDeletion
      ev.content = 'Delete'
      ev.tag(event)
      await ev.publish(relaySet)
      onDelete?.()
    } finally {
      setLoading(false)
    }
  }, [ndk, relaySet, event, onDelete])

  return (
    <LoadingButton
      loading={loading}
      variant="outlined"
      color="error"
      onClick={handleDelete}
    >
      {label}
    </LoadingButton>
  )
}
