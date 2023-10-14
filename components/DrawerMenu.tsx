'use client'
import { FC, Fragment, useCallback, useState } from 'react'
import {
  ArticleOutlined,
  ExitToApp,
  NotesOutlined,
  SensorsOutlined,
} from '@mui/icons-material'
import {
  Box,
  Drawer,
  IconButtonProps,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material'
import ProfileChip from './ProfileChip'
import { useAccount } from '@/hooks/useAccount'
import Link from 'next/link'
import { ProfileCard } from './ProfileActionModal'
import { useAction } from '@/hooks/useApp'
import { ProfileActionType } from '@/contexts/AppContext'

export interface MenuButtonProps extends IconButtonProps {
  hexpubkey: string
}
const DrawerMenu: FC<MenuButtonProps> = ({ hexpubkey, ...props }) => {
  const { setProfileAction } = useAction()
  const { signOut } = useAccount()
  const [open, setOpen] = useState(false)

  const toggleDrawer = useCallback(() => {
    setOpen((prev) => !prev)
    return false
  }, [])

  const closeDrawer = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <Fragment>
      <ProfileChip
        hexpubkey={hexpubkey}
        showName={false}
        onClick={toggleDrawer}
      />
      <Drawer
        anchor={'left'}
        open={open}
        onClose={toggleDrawer}
        variant="temporary"
        className="z-50"
      >
        <Toolbar
          disableGutters
          className="px-2 w-[344px] !min-h-[0px] bg-inherit !sticky top-0 z-10"
          variant="regular"
        >
          {/* <Avatar src={user.profile?.image} sx={{ width: 64, height: 64 }} />
          <IconButton onClick={closeDrawer}>
            <Close />
          </IconButton>
          <div className="mx-1" />
          <Typography>Title</Typography> */}
        </Toolbar>
        <ProfileCard
          hexpubkey={hexpubkey}
          showAbout={false}
          onClick={async () => {
            setProfileAction({
              hexpubkey: hexpubkey,
              type: ProfileActionType.View,
            })
            closeDrawer()
          }}
        />
        {/* <ProfileChip hexpubkey={hexpubkey} onClick={closeDrawer} size="large" /> */}
        <List>
          <ListItemButton LinkComponent={Link} href="/">
            <ListItemIcon>
              <NotesOutlined />
            </ListItemIcon>
            <ListItemText primary="Notes" />
          </ListItemButton>

          <ListItemButton>
            <ListItemIcon>
              <ArticleOutlined />
            </ListItemIcon>
            <ListItemText primary="Articles" />
          </ListItemButton>

          <ListItemButton LinkComponent={Link} href="/live">
            <ListItemIcon>
              <SensorsOutlined />
            </ListItemIcon>
            <ListItemText primary="Streams" />
          </ListItemButton>

          {/* <ListItemButton
            onClick={async () => {
              setProfileAction({
                hexpubkey: hexpubkey,
                type: ProfileActionType.View,
              })
              closeDrawer()
            }}
          >
            <ListItemIcon>
              <AccountCircle />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton> */}
        </List>
        <Box flex={1} />
        <Box className="w-full h-0.5 shrink-0 bg-gradient-primary" />
        <List>
          <ListItemButton
            onClick={async () => {
              await signOut()
              closeDrawer()
            }}
          >
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </List>
        {/* <Box className="w-full h-0.5 shrink-0 bg-gradient-primary" /> */}
      </Drawer>
    </Fragment>
  )
}

export default DrawerMenu
