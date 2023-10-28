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
  Typography,
} from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <Box className="flex flex-col md:flex-row mx-4 justify-center items-start">
      <List
        disablePadding
        subheader={
          <Typography variant="h5" className="min-w-full">
            Settings
          </Typography>
        }
        className="flex flex-wrap md:list-item items-center"
      >
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
      <Box className="my-2 md:my-0 md:mx-4" />
      <Paper className="relative w-full !rounded-2xl md:max-w-2xl overflow-hidden">
        {children}
      </Paper>
    </Box>
  )
}
