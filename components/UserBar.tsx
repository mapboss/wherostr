'use client'
import { AccountContext } from '@/contexts/AccountContext'
import { MapContext } from '@/contexts/MapContext'
import { NostrContext } from '@/contexts/NostrContext'
import { Login, Logout } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  IconButton,
  TextField,
} from '@mui/material'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import Geohash from 'latlon-geohash'
import {
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import ProfileChip from '@/components/ProfileChip'

const TempPublishForm = () => {
  const { ndk } = useContext(NostrContext)
  const { map } = useContext(MapContext)
  const [geohashString, setGeohashString] = useState('')

  useEffect(() => {
    if (!map) return
    const clickHandler = ({ lngLat }: maplibregl.MapMouseEvent) => {
      const geohash = Geohash.encode(lngLat.lat, lngLat.lng)
      setGeohashString(geohash)
    }
    map.on('click', clickHandler)
    return () => {
      map.off('click', clickHandler)
    }
  }, [map])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const { content, geohash } = Object.fromEntries(
        new FormData(event.currentTarget),
      )
      if (content && geohash) {
        const tags: any = []
        const _geohash = geohash.toString()
        const length = _geohash.length
        for (let i = 1; i <= length; i++) {
          tags.push(['g', _geohash.substring(0, i)])
        }
        const ndkEvent = new NDKEvent(ndk)
        ndkEvent.kind = NDKKind.Text
        ndkEvent.content = content.toString()
        ndkEvent.tags = tags
        console.log('ndkEvent', ndkEvent)
        try {
          await ndkEvent.publish()
          alert('Posted Successfully!')
        } catch (error) {
          alert('An error occurred!')
          console.error(error)
        }
      } else {
        alert('Content or Geohash not found!')
      }
    },
    [ndk],
  )
  return (
    <form onSubmit={handleSubmit}>
      <Card className="absolute w-80 right-4 top-20">
        <CardContent className="grid gap-4 grid-cols-1">
          <TextField
            name="content"
            label="Content"
            variant="standard"
            fullWidth
            multiline
            rows={4}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            name="geohash"
            label="Geohash"
            variant="standard"
            value={geohashString}
            onChange={(evt) => setGeohashString(evt.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </CardContent>
        <CardActions>
          <Button size="small" type="submit">
            Post
          </Button>
        </CardActions>
      </Card>
    </form>
  )
}

const UserBar = () => {
  const { user, signIn, signOut } = useContext(AccountContext)
  const signedIn = useMemo(() => {
    return !!user?.profile
  }, [user])
  const handleClickSignIn = useCallback(() => {
    signIn()
  }, [signIn])
  const handleClickSignOut = useCallback(() => {
    signOut()
  }, [signOut])
  return (
    <Box
      className={`grid items-center p-3 rounded-bl-3xl h-16${
        signedIn ? ' background-gradient' : ''
      }`}
    >
      {user?.profile ? (
        <Box className="flex items-center">
          <ProfileChip user={user} />
          <IconButton
            classes={{ root: '!ml-2' }}
            size="small"
            onClick={handleClickSignOut}
          >
            <Logout />
          </IconButton>
        </Box>
      ) : (
        <Button
          classes={{ root: 'background-gradient !rounded-full' }}
          variant="contained"
          onClick={handleClickSignIn}
          endIcon={<Login />}
        >
          Sign In
        </Button>
      )}
      <TempPublishForm />
    </Box>
  )
}

export default UserBar
