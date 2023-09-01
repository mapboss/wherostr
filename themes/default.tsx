'use client'
import { createTheme } from '@mui/material/styles'
import { Noto_Sans_Thai } from 'next/font/google'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import NextAppDirEmotionCacheProvider from './EmotionCache'

const font = Noto_Sans_Thai({
  weight: ['300', '400', '500', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
})

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0056b9',
    },
    secondary: {
      main: '#dd262b',
    },
    success: {
      main: '#008083',
    },
    warning: {
      main: '#fd5901',
    },
    error: {
      main: '#dd262b',
    },
  },
  typography: {
    fontFamily: font.style.fontFamily,
  },
})

export default function DefaultTheme({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
