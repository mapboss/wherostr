'use client'
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import {
  NostrSystem,
  EventPublisher,
  UserRelaysCache,
  RequestBuilder,
  FlatNoteStore,
  StoreSnapshot
} from "@snort/system"

import { SnortContext } from '@snort/system-react'

// Provided in-memory / indexedDb cache for relays
// You can also implement your own with "RelayCache" interface
const RelaysCache = new UserRelaysCache();

// Singleton instance to store all connections and access query fetching system
const System = new NostrSystem({
  relayCache: RelaysCache,
  // authHandler: AuthHandler // can be left undefined if you dont care about NIP-42 Auth
});

(process.env.NEXT_PUBLIC_RELAY_URLS || '')
  .split(',')
  .filter((item) => !!item).forEach(item => System.ConnectToRelay(item, { read: true, write: true }))


export const NostrContext = SnortContext

export const NostrContextProvider: FC<PropsWithChildren> = ({ children }) => {
  return <NostrContext.Provider value={System}>{children}</NostrContext.Provider>
}
