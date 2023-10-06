import type { Metadata } from 'next'
import UserBar from '@/components/UserBar'
import { AppContextProvider } from '@/contexts/AppContext'
import { AccountContextProvider } from '@/contexts/AccountContext'
import { Hidden, NoSsr } from '@mui/material'
import BottomActions from '@/components/BottomActions'

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
    <AccountContextProvider>
      <AppContextProvider>
        <Hidden mdDown>
          <header className="absolute top-0 right-0 z-10">
            <UserBar />
          </header>
        </Hidden>
        <main className="relative min-h-[calc(100%_-_56px)] h-[calc(100%-_56px)] md:min-h-full md:h-full flex flex-col flex-1 overflow-y-auto">
          <NoSsr>{children}</NoSsr>
        </main>
        <Hidden mdUp>
          <footer className="relative">
            <BottomActions />
          </footer>
        </Hidden>
      </AppContextProvider>
    </AccountContextProvider>
  )
}
