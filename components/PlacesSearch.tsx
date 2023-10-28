import * as React from 'react'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { debounce } from '@mui/material/utils'
import { OSMSearchResult, search } from '@/services/osm'

interface MainTextMatchedSubstrings {
  offset: number
  length: number
}
interface StructuredFormatting {
  main_text: string
  secondary_text: string
  main_text_matched_substrings?: readonly MainTextMatchedSubstrings[]
}
interface PlaceType {
  description: string
  structured_formatting: StructuredFormatting
}

export default function PlacesSearch() {
  const [value, setValue] = React.useState<OSMSearchResult | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [options, setOptions] = React.useState<readonly OSMSearchResult[]>([])
  const loaded = React.useRef(false)

  if (typeof window !== 'undefined' && !loaded.current) {
    loaded.current = true
  }

  const fetch = React.useMemo(
    () =>
      debounce(
        (
          request: { input: string },
          callback: (results?: readonly OSMSearchResult[]) => void,
        ) => {
          search(request.input).then(callback)
        },
        400,
      ),
    [],
  )

  React.useEffect(() => {
    let active = true

    if (inputValue === '') {
      setOptions(value ? [value] : [])
      return undefined
    }

    fetch({ input: inputValue }, (results?: readonly OSMSearchResult[]) => {
      if (active) {
        let newOptions: readonly OSMSearchResult[] = []

        if (value) {
          newOptions = [value]
        }

        if (results) {
          newOptions = [...newOptions, ...results]
        }

        setOptions(newOptions)
      }
    })

    return () => {
      active = false
    }
  }, [value, inputValue, fetch])

  return (
    <Autocomplete
      id="google-map-demo"
      fullWidth
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.display_name
      }
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      placeholder="Search by hashtag or place"
      noOptionsText="Search by hashtag or place"
      onChange={(event: any, newValue: OSMSearchResult | null) => {
        setOptions(newValue ? [newValue, ...options] : options)
        setValue(newValue)
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue)
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          margin="dense"
          size="small"
          fullWidth
          placeholder="Search by hashtag or place name"
        />
      )}
      renderOption={(props, option) => {
        // const matches = option.display_name.main_text_matched_substrings || []

        // const parts = parse(
        //   option.structured_formatting.main_text,
        //   matches.map((match: any) => [
        //     match.offset,
        //     match.offset + match.length,
        //   ]),
        // )

        return (
          <li key={option.place_id} {...props}>
            <Grid container alignItems="center">
              <Grid item sx={{ display: 'flex', width: 44 }}>
                <LocationOnIcon sx={{ color: 'text.secondary' }} />
              </Grid>
              <Grid
                item
                sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}
              >
                {/* {parts.map((part, index) => (
                  <Box
                    key={index}
                    component="span"
                    sx={{ fontWeight: part.highlight ? 'bold' : 'regular' }}
                  >
                    {part.text}
                  </Box>
                ))} */}
                <Typography variant="body2" color="text.secondary">
                  {option.display_name}
                </Typography>
              </Grid>
            </Grid>
          </li>
        )
      }}
    />
  )
}
