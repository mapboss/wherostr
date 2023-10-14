import NDK, { NDKEvent } from '@nostr-dev-kit/ndk'
import { nanoid } from 'nanoid'

export const shortenUrl = (url: string, ndk?: NDK) => {
  const nid = nanoid(8)
  const ev = new NDKEvent(ndk)
  ev.kind = 1994
  ev.tags = [
    ['d', nid],
    ['r', url],
  ]
  return { event: ev, url: `https://w3.do/${nid}` }
}
