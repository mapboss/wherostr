import * as React from 'react'
import TextField, { TextFieldProps } from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { debounce } from '@mui/material/utils'
import { OSMSearchResult, search } from '@/services/osm'
import Geohash from 'latlon-geohash'

interface MainTextMatchedSubstrings {
  offset: number
  length: number
}
interface StructuredFormatting {
  main_text: string
  secondary_text: string
  main_text_matched_substrings?: readonly MainTextMatchedSubstrings[]
}

interface SearchBoxProps {
  onChange?: (q?: string) => void
  value?: string
}

const SearchBox: React.FC<TextFieldProps & SearchBoxProps> = ({
  placeholder,
  onChange,
  value,
  ...props
}) => {
  const [loading, setLoading] = React.useState(false)
  const [inputText, setInputText] = React.useState('')
  const [inputValue, setInputValue] = React.useState('')
  const [options, setOptions] = React.useState<
    readonly Partial<OSMSearchResult>[]
  >([])

  const fetch = React.useMemo(
    () =>
      debounce(
        (
          request: { input: string },
          callback: (results?: readonly Partial<OSMSearchResult>[]) => void,
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
      setOptions([])
      return undefined
    }

    const searchHashTagOptions = {
      place_id: -1,
      name: inputValue
        .split(' ')
        .filter((d) => !!d.trim())
        .map((d) => `t:${d.trim()}`)
        .join(';'),
      display_name: `Search notes: ${inputValue
        .split(' ')
        .filter((d) => !!d.trim())
        .map((d) => `#${d.trim()}`)
        .join(', ')}`,
    }

    const searchPeopleOptions = {
      place_id: -2,
      name: inputValue
        .split(' ')
        .filter((d) => !!d.trim())
        .map((d) => `p:${d.trim()}`)
        .join(';'),
      display_name: `Search people: ${inputValue.trim()}`,
    }

    setOptions([searchHashTagOptions])

    setLoading(true)
    fetch(
      { input: inputValue },
      (results?: readonly Partial<OSMSearchResult>[]) => {
        if (active) {
          let newOptions: readonly Partial<OSMSearchResult>[] = [
            searchHashTagOptions,
          ]

          if (!!results?.length) {
            newOptions = [...newOptions, ...results]
          }

          setOptions(newOptions)
        }
        setLoading(false)
      },
    )

    return () => {
      active = false
      setLoading(false)
    }
  }, [inputValue, fetch])

  return (
    <Autocomplete
      fullWidth
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.display_name!
      }
      options={options}
      disablePortal
      inputValue={inputText}
      noOptionsText={placeholder}
      selectOnFocus
      handleHomeEndKeys={false}
      onChange={(event: any, newValue: Partial<OSMSearchResult> | null) => {
        setInputText('')
        if (newValue?.place_id === -1) {
          onChange?.(newValue.name)
        } else if (newValue?.boundingbox) {
          const [y1, y2, x1, x2] = newValue.boundingbox.map((b: string) =>
            Number(b),
          )
          const bbhash = `b:${Geohash.encode(y1, x1, 10)},${Geohash.encode(
            y2,
            x2,
            10,
          )}`
          onChange?.(bbhash)
        } else if (newValue?.lat && newValue?.lon) {
          const ghash = `g:${Geohash.encode(
            Number(newValue?.lat),
            Number(newValue?.lon),
            10,
          )}`
          onChange?.(ghash)
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          margin="dense"
          size="small"
          fullWidth
          placeholder={placeholder}
          onChange={(e) => {
            const newValue = e.target.value
            setInputValue(newValue)
            setInputText(newValue)
          }}
        />
      )}
      // loading={loading}
      // loadingText={<LinearProgress />}
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
          <li {...props} key={option.place_id}>
            <Grid container alignItems="center">
              {option.place_id === -1 ? (
                <div />
              ) : // <Grid item sx={{ display: 'flex', width: 44 }}>
              //   <Note sx={{ color: 'text.secondary' }} />
              // </Grid>
              option.place_id === -2 ? (
                <div />
              ) : (
                // <Grid item sx={{ display: 'flex', width: 44 }}>
                //   <People sx={{ color: 'text.secondary' }} />
                // </Grid>
                <Grid item sx={{ display: 'flex', width: 44 }}>
                  <LocationOnIcon sx={{ color: 'text.secondary' }} />
                </Grid>
              )}
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

export default SearchBox
