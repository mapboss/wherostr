'use client'
import {
  CircularProgress,
  IconButton,
  InputAdornment,
  Box,
  TextField,
  BaseTextFieldProps,
  TextFieldProps,
  Chip,
} from '@mui/material'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownward, ArrowDropDown, Search } from '@mui/icons-material'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import buffer from '@turf/buffer'
import { search } from '@/services/osm'
import { useUser } from '@/hooks/useAccount'

export interface FilterProps extends BaseTextFieldProps {
  feedType?: 'follows' | 'global'
  precision?: number
  className?: string
  onSearch?: (payload?: SearchPayload) => void
  InputProps?: TextFieldProps['InputProps']
}

export interface SearchPayload {
  bbox?: [number, number, number, number]
  geohash?: string
  q?: string
  places?: any[]
}

const Filter: FC<FilterProps> = ({
  feedType,
  precision = 9,
  className,
  onSearch,
  ...props
}) => {
  const user = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const querySearch = searchParams.get('q') || ''
  const [keyword, setKeyword] = useState<string>()
  const [loading, setLoading] = useState(false)
  // const [placeList, setPlaceList] = useState<any[]>(placeList)

  const fetchSearch = useCallback(
    async (querySearch: string) => {
      if (!querySearch || !onSearch) return {}
      try {
        setLoading(true)
        const result = await search(querySearch)
        const place = result?.[0]
        if (!place?.boundingbox) {
          const data = { q: querySearch, places: [] }
          onSearch(data)
          return data
        }
        // const lat = Number(place.lat)
        // const lon = Number(place.lon)
        // const g = geohash.encode(lat, lon, precision)
        const [y1, y2, x1, x2] = place.boundingbox.map((b: string) => Number(b))
        const polygon = buffer(bboxPolygon([x1, y1, x2, y2]), 1, {
          units: 'kilometers',
        })
        const bounds = bbox(polygon)
        const data = {
          bbox: bounds as SearchPayload['bbox'],
          q: querySearch,
          places: result,
          // geohash: g,
          // places: data,
        }
        onSearch(data)
        return data
      } catch (err) {
      } finally {
        setLoading(false)
      }
    },
    [onSearch],
  )

  useEffect(() => {
    if (
      querySearch &&
      querySearch !== 'follows' &&
      querySearch !== 'global'
    ) {
      fetchSearch(querySearch)
    } else {
      onSearch?.({ q: '', places: [] })
    }
  }, [onSearch, fetchSearch, querySearch])

  // useEffect(() => {
  //   if (!onSearch) return
  //   if (state !== 'resolved') return
  //   if (!data.places?.length || data.places?.length === 1) {
  //     onSearch?.(data)
  //   } else if (data.places.length > 1) {
  //     onSearch?.(data)
  //     console.log('data.places', data.places)
  //   }
  // }, [data, state, onSearch])

  const tags = useMemo(
    () =>
      querySearch !== 'global' && querySearch !== 'follows'
        ? querySearch.split(' ').filter((d) => !!d.trim())
        : [],
    [querySearch],
  )

  return (
    <Box
      className={className}
      component={'form'}
      onSubmit={async (evt) => {
        evt.preventDefault()
        const q = evt.currentTarget['search'].value
        setKeyword('')
        router.push(`${pathname}?q=${q}`)
      }}
    >
      <TextField
        {...props}
        fullWidth
        value={keyword}
        onChange={(evt) => setKeyword(evt.target.value)}
        name="search"
        size="small"
        margin="dense"
        placeholder="Search notes and places"
        sx={{ my: 1 }}
        autoComplete="off"
        InputProps={{
          ...props.InputProps,
          sx: { pl: 0.5 },
          startAdornment: (
            <InputAdornment position="start">
              {!!tags.length ? (
                tags.map((d) => (
                  <Chip
                    key={d}
                    label={`#${d}`}
                    onDelete={() => {
                      router.push(
                        `${pathname}?q=${tags
                          .filter((_d) => d !== _d)
                          .join(' ')}`,
                      )
                    }}
                  />
                ))
              ) : feedType === 'follows' ? (
                <Chip
                  label="Following"
                  deleteIcon={<ArrowDropDown />}
                  onClick={() => router.replace(`${pathname}?q=global`)}
                  onDelete={() => router.replace(`${pathname}?q=global`)}
                />
              ) : (
                <Chip
                  label="Global"
                  deleteIcon={<ArrowDropDown />}
                  onClick={
                    user ? () => router.replace(`${pathname}?q=follows`) : undefined
                  }
                  onDelete={
                    user ? () => router.replace(`${pathname}?q=follows`) : undefined
                  }
                />
              )}
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading === true ? (
                <CircularProgress color="inherit" size={20} />
              ) : null}
              <IconButton type="submit">
                <Search />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  )
}

export default Filter
