import { NDKEvent } from '@nostr-dev-kit/ndk'
import Geohash from 'latlon-geohash'
import { LngLat } from 'maplibre-gl'

export const extractLngLat = (event: NDKEvent): LngLat | undefined => {
  const geohashes = event.getMatchingTags('g')
  if (!geohashes.length) return
  geohashes.sort((a, b) => b[1].length - a[1].length)
  if (!geohashes[0]) return
  const { lat, lon } = Geohash.decode(geohashes[0][1])
  if (!lat || !lon) return
  return new LngLat(lon, lat)
}
