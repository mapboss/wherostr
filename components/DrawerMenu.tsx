'use client'
import { FC, Fragment, useCallback, useState } from 'react'
import {
  AccountCircle,
  ArticleOutlined,
  ExitToApp,
  NotesOutlined,
  SensorsOutlined,
  Settings,
} from '@mui/icons-material'
import {
  Avatar,
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
import { NDKUser } from '@nostr-dev-kit/ndk'
import { useAccount } from '@/hooks/useAccount'
import { useAction } from '@/hooks/useApp'
import { ProfileActionType } from '@/contexts/AppContext'

export interface MenuButtonProps extends IconButtonProps {
  user: NDKUser
}
const MenuButton: FC<MenuButtonProps> = ({ user, ...props }) => {
  const { signOut } = useAccount()
  const { setProfileAction } = useAction()
  const [open, setOpen] = useState(false)

  const toggleDrawer = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const closeDrawer = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <Fragment>
      <ProfileChip user={user} showName={false} onClick={toggleDrawer} />
      <Drawer
        anchor={'left'}
        open={open}
        onClose={toggleDrawer}
        variant="temporary"
        className="z-50"
      >
        <Toolbar
          disableGutters
          className="px-2 w-[320px] !min-h-[0px] bg-inherit !sticky top-0 z-10"
          variant="regular"
        >
          {/* <Avatar src={user.profile?.image} sx={{ width: 64, height: 64 }} />
          <IconButton onClick={closeDrawer}>
            <Close />
          </IconButton>
          <div className="mx-1" />
          <Typography>Title</Typography> */}
        </Toolbar>
        <Avatar src={user.profile?.image} sx={{ width: 64, height: 64 }} />
        <List>
          <ListItemButton>
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

          <ListItemButton>
            <ListItemIcon>
              <SensorsOutlined />
            </ListItemIcon>
            <ListItemText primary="Streams" />
          </ListItemButton>

          <ListItemButton
            onClick={async () => {
              setProfileAction({
                hexpubkey: user.hexpubkey,
                type: ProfileActionType.View,
              })
              closeDrawer()
            }}
          >
            <ListItemIcon>
              <AccountCircle />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
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

export default MenuButton
