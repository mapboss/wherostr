'use client'
import UserBar from '@/components/UserBar'
import { AppContextProvider } from '@/contexts/AppContext'
import { AccountContextProvider } from '@/contexts/AccountContext'
import { Hidden } from '@mui/material'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      </AppContextProvider>
    </AccountContextProvider>
  )
}
