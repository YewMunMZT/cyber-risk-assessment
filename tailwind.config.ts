import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        uob: {
          red:       '#CC0000',
          'red-dark':'#A80000',
          'red-deep':'#800000',
          'red-light':'#FF1A1A',
          dark:      '#1B1B1B',
          'dark-2':  '#2D2D2D',
          'dark-3':  '#3D3D3D',
          gray:      '#6B6B6B',
          'light':   '#F5F5F5',
          'border':  '#E0E0E0',
        },
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
