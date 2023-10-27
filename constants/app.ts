export enum ErrorCode {
  ProfileNotFound = 'ERROR_PROFILE_NOT_FOUND',
  EventNotFound = 'ERROR_EVENT_NOT_FOUND',
}

// debug from zap.stream
export const streamRelayUrls = [
  'wss://nostr.wine',
  'wss://nos.lol',
  'wss://relay.damus.io',
  'wss://relay.snort.social',
]

export const nip5Regexp =
  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
