import './globals.css'
import { DefaultTheme } from '@/themes'
import { NostrContextProvider } from '@/contexts/NostrContext'
import { AccountContextProvider } from '@/contexts/AccountContext'

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
            <AccountContextProvider>{children}</AccountContextProvider>
          </NostrContextProvider>
        </DefaultTheme>
      </body>
    </html>
  )
}
