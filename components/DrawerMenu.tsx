'use client'
import { FC, Fragment, useCallback, useState } from 'react'
import {
  ArticleOutlined,
  Close,
  ExitToApp,
  NotesOutlined,
  SensorsOutlined,
  Settings,
} from '@mui/icons-material'
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material'
import ProfileChip, { ProfileChipProps } from './ProfileChip'
import { useAccount } from '@/hooks/useAccount'
import Link from 'next/link'
import { ProfileCard } from './ProfileCard'
import { useAction } from '@/hooks/useApp'
import { ProfileActionType } from '@/contexts/AppContext'
import { usePathname } from 'next/navigation'

export interface MenuButtonProps {
  hexpubkey: string
  slotProps?: {
    profileChip?: ProfileChipProps
  }
}
const DrawerMenu: FC<MenuButtonProps> = ({ hexpubkey, slotProps }) => {
  const pathname = usePathname()
  const { setProfileAction } = useAction()
  const { readOnly, signOut } = useAccount()
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
        {...slotProps?.profileChip}
        hexpubkey={hexpubkey}
        showName={slotProps?.profileChip?.showName ?? false}
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
        />
        <IconButton
          size="small"
          onClick={closeDrawer}
          className="!absolute right-2 top-2 !bg-[#0000001f]"
        >
          <Close />
        </IconButton>
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
          <ListItemButton
            selected={pathname === '/'}
            LinkComponent={Link}
            href="/"
            onClick={async () => {
              closeDrawer()
            }}
          >
            <ListItemIcon>
              <NotesOutlined />
            </ListItemIcon>
            <ListItemText primary="Notes" />
          </ListItemButton>

          <ListItemButton
            selected={pathname.startsWith('/articles')}
            disabled
            onClick={async () => {
              closeDrawer()
            }}
          >
            <ListItemIcon>
              <ArticleOutlined />
            </ListItemIcon>
            <ListItemText primary="Articles (Coming soon)" />
          </ListItemButton>

          <ListItemButton
            selected={pathname.startsWith('/live')}
            LinkComponent={Link}
            href="/live"
            onClick={async () => {
              closeDrawer()
            }}
          >
            <ListItemIcon>
              <SensorsOutlined />
            </ListItemIcon>
            <ListItemText primary="Streams" />
          </ListItemButton>

          {!readOnly && (
            <ListItemButton
              selected={pathname.startsWith('/settings')}
              LinkComponent={Link}
              href="/settings"
              onClick={async () => {
                closeDrawer()
              }}
            >
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          )}

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
