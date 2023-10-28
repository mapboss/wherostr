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
  Menu,
  List,
} from '@mui/material'
import {
  ChangeEvent,
  FC,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ArrowDownward, ArrowDropDown, Search } from '@mui/icons-material'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import buffer from '@turf/buffer'
import { search } from '@/services/osm'
import { useUser } from '@/hooks/useAccount'
import _ from 'lodash'
import PlacesSearch from './PlacesSearch'

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLFormElement>(null)
  const open = Boolean(anchorEl)
  const handleShowMenu = (elem: HTMLFormElement | null) => {
    setAnchorEl(elem)
  }
  const handleCloseMenu = () => {
    setAnchorEl(null)
  }
  // const [placeList, setPlaceList] = useState<any[]>(placeList)

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
  const ref = useRef<HTMLFormElement>(null)

  return (
    <Box
      className={className}
      component={'form'}
      ref={ref}
      // onSubmit={async (evt) => {
      //   evt.preventDefault()
      //   const q = evt.currentTarget['search'].value
      //   setKeyword('')
      //   router.push(`${pathname}?q=${q}`)
      // }}
    >
      <PlacesSearch />
      {/* <TextField
        {...props}
        fullWidth
        value={keyword}
        inputRef={ref}
        onChange={async (evt) => {
          try {
            const text = evt.target.value
            setKeyword(text)
            if (!text) {
              return handleCloseMenu()
            }
            // handleShowMenu(ref.current)
            setLoading(true)
            const result = await _.throttle(() => fetchSearch(text), 300)()
            console.log('result', result)
          } finally {
            setLoading(false)
          }
        }}
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
                    user
                      ? () => router.replace(`${pathname}?q=follows`)
                      : undefined
                  }
                  onDelete={
                    user
                      ? () => router.replace(`${pathname}?q=follows`)
                      : undefined
                  }
                />
              )}
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton type="submit">
                <Search />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Menu
        MenuListProps={{
          'aria-labelledby': 'long-button',
          disablePadding: true,
        }}
        transformOrigin={{
          horizontal: 'left',
          vertical: 'top',
        }}
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        // slotProps={{
        //   paper: {
        //     style: {
        //       width: '20ch',
        //     },
        //   },
        // }}
      >
        <List disablePadding>
        </List>
      </Menu> */}
    </Box>
  )
}

export default Filter
