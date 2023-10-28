'use client'
import { AccountCircleOutlined, WalletOutlined } from '@mui/icons-material'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <Box className="flex mx-4 justify-center">
      <List>
        <ListItem>
          <ListItemText
            primaryTypographyProps={{
              variant: 'h5',
              fontWeight: 'bold',
            }}
            primary="Settings"
          />
        </ListItem>
        <ListItemButton
          disabled
          className="!rounded-2xl"
          LinkComponent={Link}
          href="/settings/profile"
          selected={pathname === '/settings/profile/'}
        >
          <ListItemIcon>
            <AccountCircleOutlined />
          </ListItemIcon>
          <ListItemText
            primary="Profile"
            primaryTypographyProps={{
              variant: 'h6',
            }}
          />
        </ListItemButton>
        <ListItemButton
          className="!rounded-2xl"
          LinkComponent={Link}
          href="/settings/wallet"
          selected={pathname === '/settings/wallet/'}
        >
          <ListItemIcon>
            <WalletOutlined />
          </ListItemIcon>
          <ListItemText
            primary="Wallet"
            primaryTypographyProps={{
              variant: 'h6',
            }}
          />
        </ListItemButton>
      </List>
      <Box mx={2} />
      <Paper className="relative w-full !rounded-2xl max-w-2xl overflow-hidden">
        {children}
      </Paper>
    </Box>
  )
}
