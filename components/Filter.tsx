'use client'
import {
  CircularProgress,
  IconButton,
  InputAdornment,
  Box,
  TextField,
} from '@mui/material'
import { FC, useEffect } from 'react'
import axios, { AxiosResponse } from 'axios'
import { SearchOutlined } from '@mui/icons-material'
import usePromise from 'react-use-promise'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import buffer from '@turf/buffer'

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
  places?: any[]
}

const Filter: FC<FilterProps> = ({ precision = 9, className, onSearch }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const keyword = searchParams.get('keyword')

  const [data, error, state] = usePromise<SearchPayload>(async () => {
    if (!keyword) return {}
    const result = await search(keyword)
    const place = result?.[0]
    if (!place?.boundingbox) {
      return { keyword, places: [] }
    }
    // const lat = Number(place.lat)
    // const lon = Number(place.lon)
    // const g = geohash.encode(lat, lon, precision)
    const [y1, y2, x1, x2] = place.boundingbox.map((b: string) => Number(b))
    console.log([x1, y1, x2, y2])
    const polygon = buffer(bboxPolygon([x1, y1, x2, y2]), 1, {
      units: 'kilometers',
    })
    const bounds = bbox(polygon)
    return {
      bbox: bounds as SearchPayload['bbox'],
      keyword,
      // geohash: g,
      // places: data,
    }
  }, [keyword])

  useEffect(() => {
    if (state !== 'resolved' || !data.keyword) return
    onSearch?.(data)
  }, [data, state, onSearch])

  return (
    <Box
      className={className}
      component={'form'}
      onSubmit={async (evt) => {
        evt.preventDefault()
        const keyword = evt.currentTarget['search'].value
        router.push(`${pathname}?keyword=${keyword}`)
      }}
    >
      <TextField
        fullWidth
        defaultValue={keyword}
        name="search"
        size="small"
        margin="dense"
        placeholder="Search"
        sx={{ my: 1 }}
        autoComplete="off"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {state === 'pending' ? (
                <CircularProgress color="inherit" size={20} />
              ) : null}
              <IconButton>
                <SearchOutlined />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  )
}

export default Filter
