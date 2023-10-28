import Geohash from 'latlon-geohash'

interface ExtractQueryResult {
  tags?: string[]
  npub?: string
  bbox?: [number, number, number, number]
  bhash?: [string, string]
  lnglat?: [number, number]
  geohash?: string
}
export const extractQuery = (q?: string): ExtractQueryResult | undefined => {
  if (!q) return
  const result = q
    .split(';')
    .reduce<ExtractQueryResult | undefined>((a, query) => {
      const [tag, value] = query.split(':')
      if (tag === 't') {
        if (!a) a = {}
        if (!a.tags) a.tags = []
        a.tags.push(value.trim())
      } else if (tag === 'p') {
        if (!a) a = {}
        a.npub = value
      } else if (tag === 'b') {
        if (!a) a = {}
        const [g1, g2] = value.split(',')
        const { lat: y1, lon: x1 } = Geohash.decode(g1)
        const { lat: y2, lon: x2 } = Geohash.decode(g2)
        a.bbox = [x1, y1, x2, y2]
        a.bhash = [g1, g2]
      } else if (tag === 'g') {
        if (!a) a = {}
        const { lat, lon } = Geohash.decode(value)
        a.geohash = value
        a.lnglat = [lon, lat]
      }
      return a
    }, undefined)
  return result
}
