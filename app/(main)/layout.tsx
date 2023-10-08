'use client'
import UserBar from '@/components/UserBar'
import { AppContextProvider } from '@/contexts/AppContext'
import { AccountContextProvider } from '@/contexts/AccountContext'
import { Hidden } from '@mui/material'
import { useContext } from 'react'
import { NostrContext } from '@/contexts/NostrContext'
import SplashScreen from '@/components/SplashScreen'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { connected } = useContext(NostrContext)
  return (
    <AccountContextProvider>
      <AppContextProvider>
        <Hidden mdDown>
          <header className="absolute top-0 right-0 z-10">
            <UserBar />
          </header>
        </Hidden>
        <main className="relative min-h-full h-full flex flex-col flex-1">
          {children}
        </main>
        <SplashScreen in={!connected} />
      </AppContextProvider>
    </AccountContextProvider>
  )
}
