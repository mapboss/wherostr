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
    <AppContextProvider>
      <AccountContextProvider>
        <main className="relative min-h-full h-full flex flex-col flex-1">
          <NoSsr>{children}</NoSsr>
        </main>
      </AccountContextProvider>
    </AppContextProvider>
  )
}
