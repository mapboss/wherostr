import type { Metadata } from 'next'
import UserBar from '@/components/UserBar'
import { AppContextProvider } from '@/contexts/AppContext'
import { AccountContextProvider } from '@/contexts/AccountContext'
import { Hidden } from '@mui/material'
import { NostrContextProvider } from '@/contexts/NostrContext'

export const metadata: Metadata = {
  title: 'Wherostr',
  description: 'Wherostr',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NostrContextProvider>
      <AccountContextProvider>
        <AppContextProvider>
          <Hidden mdDown>
            <header className="absolute top-0 right-0 z-10">
              <UserBar />
            </header>
          </Hidden>
          <main className="min-h-screen h-screen flex flex-col">
            {children}
          </main>
        </AppContextProvider>
      </AccountContextProvider>
    </NostrContextProvider>
  )
}
