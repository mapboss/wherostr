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
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'

interface MenuItemProps {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  href?: (event: NDKEvent) => string
}

interface MenuOptionProps {
  items: MenuItemProps[]
}

const options: MenuOptionProps[] = [
  {
    items: [
      {
        id: 'open_new_tab',
        label: 'Open in new tab',
        href: (event) => {
          return `/n/?naddr=${nip19.noteEncode(event.id)}`
        },
      },
    ],
  },
  {
    items: [
      {
        id: 'copy_text',
        label: 'Copy Text',
      },
      {
        id: 'copy_user_id',
        label: 'Copy Author ID',
      },
      {
        id: 'copy_note_id',
        label: 'Copy Note ID',
      },
    ],
  },
  {
    items: [
      {
        id: 'mute',
        label: 'Mute (coming soon)',
        disabled: true,
      },
    ],
  },
]

export default function MenuButton({ event }: { event: NDKEvent }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const handleMenuClick = (menuId: string) => {
    handleClose()
    switch (menuId) {
      case 'copy_text':
        copy(event.content)
        return
      case 'copy_user_id':
        copy(event.author.npub)
        return
      case 'copy_note_id':
        copy(nip19.noteEncode(event.id))
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
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button',
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
          return (
            <>
              {i > 0 && <Divider />}
              {option.items.map((item) => (
                <ListItemButton
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
              ))}
            </>
          )
        })}
      </Menu>
    </>
  )
}
