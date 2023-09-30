import './globals.css'
import { DefaultTheme } from '@/themes'
import { NostrContextProvider } from '@/contexts/NostrContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="lightning" content="lnurlp:nickydev@getalby.com" />
        <meta property="og:image" content="https://www.your.blog/YOUR_IMAGE" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <DefaultTheme>
          <NostrContextProvider>{children}</NostrContextProvider>
        </DefaultTheme>
      </body>
    </html>
  )
}
