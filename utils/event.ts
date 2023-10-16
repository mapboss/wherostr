import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'

export const isComment = (event: NDKEvent) => {
  const tagE = event.getMatchingTags('e')
  const tagA = event.getMatchingTags('a')
  let isReply = tagE.some(([_1, _2, _3, desc]) => desc !== 'mention')
  isReply = isReply || tagA.some(([_1, _2, _3, desc]) => desc !== 'mention')
  // if (tagA.length > 0) {
  //   console.log('isComment', { event, tagE, tagA, isReply })
  // }
  return event.kind === NDKKind.Text && isReply
}
