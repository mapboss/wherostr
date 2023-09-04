import './globals.css'
import type { Metadata } from 'next'
import { DefaultTheme } from '@/themes'
import UserBar from '@/components/UserBar'
import { NostrContextProvider } from '@/contexts/NostrContext'
import { AccountContextProvider } from '@/contexts/AccountContext'
import { EventContextProvider } from '@/contexts/EventContext'
import { MapContextProvider } from '@/contexts/MapContext'

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
    <html lang="en">
      <body>
        <DefaultTheme>
          <NostrContextProvider>
            <EventContextProvider>
              <MapContextProvider>
                <AccountContextProvider>
                  <header className="absolute top-0 right-0 z-10">
                    <UserBar />
                  </header>
                  <main className="min-h-screen flex flex-col">{children}</main>
                </AccountContextProvider>
              </MapContextProvider>
            </EventContextProvider>
          </NostrContextProvider>
        </DefaultTheme>
      </body>
    </html>
  )
}
