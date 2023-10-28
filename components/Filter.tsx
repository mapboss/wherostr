'use client'
import {
  BaseTextFieldProps,
  TextFieldProps,
  IconButton,
  Paper,
} from '@mui/material'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import buffer from '@turf/buffer'
import { search } from '@/services/osm'
import _ from 'lodash'
import SearchBox from './SearchBox'
import { Close, Search } from '@mui/icons-material'
import classNames from 'classnames'

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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showSearch, setShowSearch] = useState(false)
  const querySearch = searchParams.get('q') || ''
  const showMap = searchParams.get('map') || ''
  const fetchSearch = useCallback(async (querySearch: string) => {
    if (!querySearch) return {}
    const result = await search(querySearch)
    const place = result?.[0]
    if (!place?.boundingbox) {
      const data = { q: querySearch, places: [] }
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
    return data
  }, [])

  useEffect(() => {
    if (querySearch && querySearch !== 'follows' && querySearch !== 'global') {
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
    <Paper
      className={classNames(
        'flex !flex-none items-center justify-end !shadow-none',
        className,
        {
          'absolute left-16 right-3 z-50 bg-[inherit]': showSearch,
        },
      )}
    >
      {showSearch && (
        <SearchBox
          placeholder="Search by hashtag or place"
          name="search"
          size="small"
          margin="dense"
          onChange={(value) => {
            router.push(`${pathname}?q=${value}&map=${showMap}`)
          }}
          value={querySearch}
        />
      )}
      <IconButton
        className="min-w-[40px]"
        onClick={() => setShowSearch((prev) => !prev)}
      >
        {showSearch ? <Close /> : <Search />}
      </IconButton>
    </Paper>
  )
}

export default Filter
