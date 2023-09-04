import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      primary: {
        DEFAULT: 'rgb(252, 106, 3)',
        light: 'rgb(252, 135, 53)',
        dark: 'rgb(176, 74, 2)',
      },
      secondary: {
        DEFAULT: 'rgb(3, 149, 252)',
        light: 'rgb(53, 170, 252)',
        dark: 'rgb(2, 104, 176)',
      },
      success: {
        DEFAULT: 'rgb(0, 128, 131)',
        light: 'rgb(51, 153, 155)',
        dark: 'rgb(0, 89, 91)',
      },
      info: {
        DEFAULT: 'rgb(3, 149, 252)',
        light: 'rgb(53, 170, 252)',
        dark: 'rgb(2, 104, 176)',
      },
      warning: {
        DEFAULT: 'rgb(253, 89, 1)',
        light: 'rgb(253, 122, 51)',
        dark: 'rgb(177, 62, 0)',
      },
      error: {
        DEFAULT: 'rgb(221, 38, 43)',
        light: 'rgb(227, 81, 85)',
        dark: 'rgb(154, 26, 30)',
      },
      disabled: {
        DEFAULT: 'rgba(255, 255, 255, 0.5)',
      },
      contrast: {
        primary: 'rgba(255, 255, 255, 1)',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
