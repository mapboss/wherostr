'use client'
import {
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
} from '@mui/material'
import { FC, useState } from 'react'
import axios, { AxiosResponse } from 'axios'
import { SearchOutlined } from '@mui/icons-material'
import geohash from 'latlon-geohash'
import { NDKFilter } from '@nostr-dev-kit/ndk'

// https://nominatim.openstreetmap.org/search?<params>
export async function search<TOutput = any[], TInput = string>(
  payload?: TInput,
) {
  const res = await axios.get<TInput, AxiosResponse<TOutput>>(
    'https://nominatim.openstreetmap.org/search',
    { params: { q: payload, format: 'jsonv2' } },
  )
  return res.data
}
export interface FilterProps {
  precision?: number
  className?: string
  onSearch?: (payload?: SearchPayload) => void
}

export interface SearchPayload {
  bbox?: [number, number, number, number]
  geohash?: string
  keyword?: string
  filter?: NDKFilter
  places?: any[]
}

const Filter: FC<FilterProps> = ({ precision = 9, className, onSearch }) => {
  const [loading, setLoading] = useState<boolean>(false)
  return (
    <Paper
      className="p-4"
      component={'form'}
      onSubmit={async (evt) => {
        evt.preventDefault()
        const keyword = evt.currentTarget['search'].value
        if (!keyword) {
          return
        }
        setLoading(true)
        try {
          const result = await search(keyword)
          const place = result?.[0]
          if (!place) {
            onSearch?.({ keyword, places: [], filter: {} })
            return
          }
          const lat = Number(place.lat)
          const lon = Number(place.lon)
          const g = geohash.encode(lat, lon, precision)
          const [y1, y2, x1, x2] = place.boundingbox.map((b: string) => Number(b))
          onSearch?.({
            bbox: [x1, y1, x2, y2],
            places: result,
            keyword,
            geohash: g,
            filter: { '#g': [g] },
          })
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }}
    >
      <TextField
        fullWidth
        name="search"
        size="small"
        margin="dense"
        placeholder="Search"
        sx={{ my: 1 }}
        autoComplete="off"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {loading ? <CircularProgress color="inherit" size={20} /> : null}
              <IconButton>
                <SearchOutlined />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Paper>
  )
}

export default Filter
