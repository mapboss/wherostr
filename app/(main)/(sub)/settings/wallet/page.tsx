'use client'

import { Box, Divider, Typography } from '@mui/material'
import { Button as BitcoinConnect } from '@getalby/bitcoin-connect-react'

export default function Page() {
  return (
    <Box p={2}>
      <Typography variant="h4">Nostr Wallet Connect</Typography>
      <Divider className="!my-4" />
      <BitcoinConnect appName="Wherostr" />
    </Box>
  )
}
