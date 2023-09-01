import './globals.css'
import type { Metadata } from 'next'
import { DefaultTheme } from '@app/themes'
import UserBar from '@/components/UserBar'

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
          <header className="absolute top-0 right-0">
            <UserBar />
          </header>
          <main className="min-h-screen flex flex-col">{children}</main>
        </DefaultTheme>
      </body>
    </html>
  )
}
