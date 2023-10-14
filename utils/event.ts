import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'

export const isComment = (event: NDKEvent) => {
  const tagE = event.tagValue('e')
  const tagA = event.tagValue('a')

  return event.kind === NDKKind.Text && (!!tagE || !!tagA)
}
