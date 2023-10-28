'use client'

import { Box, Divider, Typography } from '@mui/material'
import { Button as BitcoinConnect } from '@getalby/bitcoin-connect-react'
import { useMemo } from 'react'
import UAParser from 'ua-parser-js'

export default function Page() {
  const ua = useMemo(() => new UAParser(navigator.userAgent), [])
  const appName = useMemo(() => {
    if (!ua) return
    const os = ua.getOS()
    const browser = ua.getBrowser()
    return `Wherostr - ${os.name} - ${browser.name}`
  }, [ua])
  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight="bold">Nostr Wallet Connect</Typography>
      <Divider className="!my-4" />
      {!!appName && <BitcoinConnect appName={appName} />}
    </Box>
  )
}
