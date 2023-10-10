'use client'
import { AppContextProvider } from '@/contexts/AppContext'
import { AccountContextProvider } from '@/contexts/AccountContext'
import { Hidden, NoSsr } from '@mui/material'
import BottomActions from '@/components/BottomActions'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AccountContextProvider>
      <AppContextProvider>
        <main className="relative min-h-[calc(100%_-_48px)] h-[calc(100%-_48px)] md:min-h-full md:h-full flex flex-col flex-1 overflow-y-auto">
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
