import './globals.css'
import { DefaultTheme } from '@/themes'
import { NostrContextProvider } from '@/contexts/NostrContext'
import { Metadata } from 'next'

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
      <head>
        <meta name="lightning" content="lnurlp:nickydev@getalby.com" />
        <meta property="og:image" content="/pin.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/pin.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/pin.svg" />
        <meta name="apple-mobile-web-app-status-bar" content="rgb(252, 106, 3)" />
        <meta name="theme-color" content="rgb(252, 106, 3)" />
      </head>
      <body className="h-[100dvh] overflow-y-auto">
        <DefaultTheme>
          <NostrContextProvider>{children}</NostrContextProvider>
        </DefaultTheme>
      </body>
    </html>
  )
}
