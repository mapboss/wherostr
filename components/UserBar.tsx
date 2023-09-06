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
import { EventBuilder } from '@snort/system'

const TempPublishForm = () => {
  const system = useContext(NostrContext)
  const { map } = useContext(MapContext)
  const { user, publisher } = useContext(AccountContext)
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
        const tags: [string, string][] = []
        const _geohash = geohash.toString()
        const length = _geohash.length
        for (let i = 1; i <= length; i++) {
          tags.push(['g', _geohash.substring(0, i)])
        }
        const eventBuilder = new EventBuilder()
        eventBuilder
          .createdAt(Math.floor(Date.now() / 1000))
          .pubKey(user!.pubkey)
          .kind(1)
          .content(content.toString())
        tags.forEach((tag) => {
          eventBuilder.tag(tag)
        })
        try {
          publisher
            ?.generic((evb) => {
              evb
                .createdAt(Math.floor(Date.now() / 1000))
                .pubKey(user!.pubkey)
                .kind(1)
                .content(content.toString())
              tags.forEach((tag) => {
                evb.tag(tag)
              })
              return evb.processContent()
            })
            .then((event) => {
              if (!event) return
              system.BroadcastEvent(event)
              alert('Posted Successfully!')
            })
        } catch (error) {
          alert('An error occurred!')
          console.error(error)
        }
      } else {
        alert('Content or Geohash not found!')
      }
    },
    [user, system],
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
    return !!user
  }, [user])
  const handleClickSignIn = useCallback(() => {
    signIn()
  }, [signIn])
  const handleClickSignOut = useCallback(() => {
    signOut()
  }, [signOut])
  return (
    <Box
      className={`grid items-center py-2 px-3 rounded-bl-3xl${
        signedIn ? ' background-gradient' : ''
      }`}
    >
      {user ? (
        <Box className="flex items-center gap-2">
          <ProfileChip user={user} />
          <IconButton size="small" onClick={handleClickSignOut}>
            <Logout />
          </IconButton>
        </Box>
      ) : (
        <Button
          className="background-gradient !rounded-full"
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
