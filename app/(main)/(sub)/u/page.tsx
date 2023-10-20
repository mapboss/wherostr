'use client'
import EventList from '@/components/EventList'
import { ProfileCardFull } from '@/components/ProfileCard'
import { useAction } from '@/hooks/useApp'
import { useNDK } from '@/hooks/useNostr'
import { useSubscribe } from '@/hooks/useSubscribe'
import { unixNow } from '@/utils/time'
import { Box, Divider, Paper } from '@mui/material'
import { NDKKind, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk'
import { RedirectType } from 'next/dist/client/components/redirect'
import {
  redirect,
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import { nip19 } from 'nostr-tools'
import { useEffect, useMemo, useRef } from 'react'
import usePromise from 'react-use-promise'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const naddr = searchParams.get('naddr') || params['naddr']

  const naddrDesc = useMemo(() => {
    try {
      return nip19.decode(naddr as string)
    } catch (err) {}
  }, [naddr])

  if (naddrDesc?.type !== 'npub' && naddrDesc?.type !== 'nprofile') {
    redirect(`/${naddr}`, RedirectType.replace)
  }

  const ndk = useNDK()
  const { eventAction, profileAction, setEventAction, setProfileAction } =
    useAction()

  const [user, error, state] = usePromise(async () => {
    if (!naddrDesc || !ndk) return
    if (naddrDesc.type !== 'npub' && naddrDesc.type !== 'nprofile') return
    const pubkey: string =
      typeof naddrDesc.data === 'string'
        ? naddrDesc.data
        : naddrDesc.data.pubkey
    const user = ndk.getUser({ hexpubkey: pubkey })
    await user.fetchProfile({
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    })
    return user
  }, [ndk, naddrDesc, naddr])

  useEffect(() => {
    if (!eventAction?.event?.id) return
    setEventAction(undefined)
    const addr = nip19.noteEncode(eventAction?.event?.id)
    router.push('/n/?naddr=' + addr)
  }, [setEventAction, router, eventAction?.event?.id])
  useEffect(() => {
    if (!profileAction?.hexpubkey) return
    setProfileAction(undefined)
    const addr = nip19.npubEncode(profileAction?.hexpubkey)
    router.push('/u/?naddr=' + addr)
  }, [setProfileAction, router, profileAction?.hexpubkey])

  const filter = useMemo(() => {
    return {
      kinds: [NDKKind.Text],
      authors: user?.hexpubkey ? [user.hexpubkey] : [],
      until: unixNow(),
      limit: 30,
    }
  }, [user?.hexpubkey])

  const [events, fetchMore] = useSubscribe(filter)
  const ref = useRef<HTMLElement>(
    typeof window !== 'undefined' ? window.document.body : null,
  )

  return (
    <Box m={4}>
      <Paper className="relative w-full !rounded-2xl max-w-2xl mx-auto overflow-hidden">
        <ProfileCardFull hexpubkey={user?.hexpubkey} />
        <Divider />
        <EventList
          events={events}
          onFetchMore={fetchMore}
          showComments={true}
          parentRef={ref}
        />
      </Paper>
    </Box>
  )
}
