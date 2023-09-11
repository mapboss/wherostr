import '@/app/globals.css'
import type { Metadata } from 'next'
import UserBar from '@/components/UserBar'
import { EventContextProvider } from '@/contexts/EventContext'

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
    <EventContextProvider>
      <header className="absolute top-0 right-0 z-10">
        <UserBar />
      </header>
      <main className="min-h-screen flex flex-col">{children}</main>
    </EventContextProvider>
  )
}
