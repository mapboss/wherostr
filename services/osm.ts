import axios, { AxiosResponse } from 'axios'

export interface OSMReverseResult {
  place_id: number
  licence: string
  osm_type: 'way'
  osm_id: number
  lat: string
  lon: string
  category: 'highway'
  type: 'residential'
  place_rank: number
  importance: number
  addresstype: 'road'
  name: string
  display_name: string
  address: {
    quarter: string
    suburb: string
    state: string
    postcode: string
    country: string
    country_code: string
    [key: string]: string
  }
  boundingbox: [string, string, string, string]
}

export async function search<TOutput = any[]>(payload?: string) {
  const res = await axios.get<string, AxiosResponse<TOutput>>(
    'https://nominatim.openstreetmap.org/search',
    { params: { q: payload, format: 'jsonv2' } },
  )
  return res.data
}

export async function reverse(ll?: number[]) {
  const res = await axios.get<number[], AxiosResponse<OSMReverseResult>>(
    'https://nominatim.openstreetmap.org/reverse',
    { params: { lat: ll?.[1], lon: ll?.[0], format: 'jsonv2' } },
  )
  return res.data
}
