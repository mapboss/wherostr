import { createTheme } from '@mui/material/styles'
import { Noto_Sans_Thai } from 'next/font/google'

const font = Noto_Sans_Thai({
  weight: ['300', '400', '500', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
})

const theme = createTheme({
  palette: {
    primary: {
      main: '#f4b400',
    },
    secondary: {
      main: '#4c8bf5',
    },
    // secondary: {
    //   main: "#dd262b",
    // },
  },
  typography: {
    fontFamily: font.style.fontFamily,
  },
})

export default theme
