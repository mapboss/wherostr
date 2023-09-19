import type { Metadata } from 'next'
import UserBar from '@/components/UserBar'
import { AppContextProvider } from '@/contexts/AppContext'
import { AccountContextProvider } from '@/contexts/AccountContext'

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
        <header className="absolute top-0 right-0 z-10">
          <UserBar />
        </header>
        <main className="min-h-screen flex flex-col">{children}</main>
      </AppContextProvider>
    </AccountContextProvider>
  )
}
