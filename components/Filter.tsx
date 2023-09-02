'use client'
import {
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
} from '@mui/material'
import { FC, useEffect, useMemo, useState } from 'react'
import _ from 'lodash'
import axios, { AxiosResponse } from 'axios'
import { useFetchQuery } from '@/hooks/useFetchQuery'
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
  className?: string
  onSearch?: (payload?: SearchPayload) => void
}

export interface SearchPayload {
  geohash?: string
  keyword?: string
  filter?: NDKFilter
  places?: any[]
}

const Filter: FC<FilterProps> = ({ className, onSearch }) => {
  const [keyword, setKeyword] = useState<string>()

  const { data, loading } = useFetchQuery([keyword], search, {
    payload: keyword,
    disabled: !keyword,
  })

  useEffect(() => {
    if (loading) return
    const place = data?.[0]
    if (!place) {
      onSearch?.({ keyword, places: [], filter: {} })
      return
    }
    const lat = Number(place.lat)
    const lon = Number(place.lon)
    const g = geohash.encode(lat, lon)
    onSearch?.({
      places: data,
      keyword,
      geohash: g,
      filter: { '#g': [g] },
    })
  }, [keyword, loading, data, onSearch])

  return (
    <Paper
      className="p-4"
      component={'form'}
      onSubmit={(evt) => {
        evt.preventDefault()
        setKeyword(evt.currentTarget['search'].value)
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
