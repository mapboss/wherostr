'use client'
import { ThemeProvider } from '@mui/material/styles'
import theme from './theme'
import Button from '@mui/material/Button'
import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk'
import { useMemo, useState } from 'react'
import { Typography } from '@mui/material'

export default function App() {
  const ndk: NDK = useMemo(() => {
    const nip07signer = new NDKNip07Signer()
    return new NDK({ signer: nip07signer })
  }, [])
  const [user, setUser]: [any, any] = useState()
  const handleClickLogin = function () {
    ndk?.signer?.user().then((_user) => {
      setUser(_user)
    })
  }
  return (
    <ThemeProvider theme={theme}>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        {user ? (
          <Typography>{user.npub}</Typography>
        ) : (
          <Button variant="outlined" size="small" onClick={handleClickLogin}>
            Login
          </Button>
        )}
      </main>
    </ThemeProvider>
  )
}
