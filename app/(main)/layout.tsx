'use client'
import { AppContextProvider } from '@/contexts/AppContext'
import { AccountContextProvider } from '@/contexts/AccountContext'
import { NoSsr } from '@mui/material'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AccountContextProvider>
      <AppContextProvider>
        <main className="relative min-h-full h-full flex flex-col flex-1 overflow-y-auto">
          <NoSsr>{children}</NoSsr>
        </main>
      </AppContextProvider>
    </AccountContextProvider>
  )
}
