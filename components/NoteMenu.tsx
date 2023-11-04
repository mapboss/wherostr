import * as React from 'react'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import copy from 'copy-to-clipboard'
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import Geohash from 'latlon-geohash'
import { useAccount, useFollowing, useMuting } from '@/hooks/useAccount'
import { LoadingButton } from '@mui/lab'
import {
  DeleteOutline,
  PersonAddOutlined,
  PersonOff,
  PersonRemoveOutlined,
} from '@mui/icons-material'
import { useCallback, useMemo, useState } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'

interface NoteMenuItemProps {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  href?: (event: NDKEvent) => string
  hide?: (event: NDKEvent) => boolean
}

interface NoteMenuOptionProps {
  items: NoteMenuItemProps[]
}

const options: NoteMenuOptionProps[] = [
  // {
  //   items: [
  //     {
  //       id: 'open_new_tab',
  //       label: 'Open in new tab',
  //       href: (event) => {
  //         return `/n/?naddr=${nip19.noteEncode(event.id)}`
  //       },
  //     },
  //   ],
  // },
  {
    items: [
      {
        id: 'copy_text',
        label: 'Copy Text',
        hide(event) {
          return event.kind !== NDKKind.Text
        },
      },
      {
        id: 'copy_user_id',
        label: 'Copy Author ID',
      },
      {
        id: 'copy_note_id',
        label: 'Copy Note ID',
      },
      {
        id: 'copy_event_json',
        label: 'Copy Event JSON',
      },
      {
        id: 'copy_coordinates',
        label: 'Copy Coordinates',
        hide(event) {
          const g = event.getMatchingTags('g')
          return !g.length
        },
      },
    ],
  },
]

export default function NoteMenu({ event }: { event: NDKEvent }) {
  const [_, mute] = useMuting()
  const { user: account, readOnly } = useAccount()
  const [follows, follow, unfollow] = useFollowing()
  const user = useUserProfile(event.author.hexpubkey)
  const [muteLoading, setMuteLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const itsYou = useMemo(
    () => account?.hexpubkey === event.author.hexpubkey,
    [account?.hexpubkey, event.author.hexpubkey],
  )
  const isFollowing = useMemo(
    () => follows.find((d) => d.hexpubkey === event.author.hexpubkey),
    [event.author.hexpubkey, follows],
  )

  const handleClickDelete = useCallback(async () => {
    if (!event.author) return
    event.delete('')
    try {
      setMuteLoading(true)
      await mute(event.author)
    } finally {
      setMuteLoading(false)
    }
  }, [mute, event.author])

  const handleClickMute = useCallback(async () => {
    if (!event.author) return
    try {
      setMuteLoading(true)
      await mute(event.author)
    } finally {
      setMuteLoading(false)
    }
  }, [mute, event.author])

  const handleClickFollow = useCallback(async () => {
    if (!user) return
    try {
      setFollowLoading(true)
      await follow(user)
    } finally {
      setFollowLoading(false)
    }
  }, [follow, user])
  const handleClickUnfollow = useCallback(async () => {
    if (!user) return
    try {
      setFollowLoading(true)
      await unfollow(user)
    } finally {
      setFollowLoading(false)
    }
  }, [unfollow, user])
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const handleMenuClick = async (menuId: string) => {
    handleClose()
    switch (menuId) {
      case 'copy_text':
        copy(event.content)
        return
      case 'copy_user_id':
        copy(event.author.npub)
        return
      case 'copy_note_id':
        const noteId =
          event.kind === NDKKind.Repost ? event.tagValue('e') || '' : event.id
        copy(nip19.noteEncode(noteId))
        return
      case 'copy_event_json':
        copy(JSON.stringify(event.rawEvent(), null, 4))
        return
      case 'copy_coordinates':
        const g = event.getMatchingTags('g')
        const [_, geohash] =
          g
            .slice()
            .sort((a, b) => b.length - a.length)
            .at(0) || []
        if (!geohash) return
        const ll = Geohash.decode(geohash)
        copy(`${ll.lat},${ll.lon}`)
        return
    }
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon className="text-contrast-secondary" />
      </IconButton>
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
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              // maxHeight: ITEM_HEIGHT * 4.5,
              width: '20ch',
            },
          },
        }}
      >
        {options.map((option, i) => {
          let lastIndex = i
          return option.items
            .filter((item) => item.hide?.(event) !== true)
            .map((item, j, all) => {
              let divider = false
              if (lastIndex === i && j === all.length - 1) {
                divider = true
                lastIndex = -1
              }
              return (
                <ListItemButton
                  divider={divider}
                  dense
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => handleMenuClick(item.id)}
                  {...(item.href
                    ? { href: item.href(event), target: '_blank' }
                    : {})}
                >
                  {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                  <ListItemText primary={item.label} />
                </ListItemButton>
              )
            })
        })}
        {!readOnly ? (
          <>
            {!itsYou ? (
              <>
                {isFollowing ? (
                  <LoadingButton
                    className="!rounded-none"
                    color="error"
                    loading={followLoading}
                    loadingPosition="start"
                    startIcon={<PersonRemoveOutlined />}
                    onClick={handleClickUnfollow}
                  >
                    Unfollow
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    color="inherit"
                    loading={followLoading}
                    loadingPosition="start"
                    startIcon={<PersonAddOutlined />}
                    onClick={handleClickFollow}
                  >
                    Follow
                  </LoadingButton>
                )}
                <LoadingButton
                  className="!rounded-none"
                  color="error"
                  loading={muteLoading}
                  loadingPosition="start"
                  startIcon={<PersonOff />}
                  onClick={handleClickMute}
                >
                  Mute
                </LoadingButton>
              </>
            ) : (
              <LoadingButton
                className="!rounded-none"
                color="error"
                // loading={deleteLoading}
                // loadingPosition="start"
                startIcon={<DeleteOutline />}
                onClick={handleClickDelete}
              >
                Delete
              </LoadingButton>
            )}
          </>
        ) : undefined}
      </Menu>
    </>
  )
}
