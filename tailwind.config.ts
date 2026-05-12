import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    { pattern: /bg-uob-/ },
    { pattern: /text-uob-/ },
    { pattern: /border-uob-/ },
    { pattern: /ring-uob-/ },
  ],
  theme: {
    extend: {
      colors: {
        uob: {
          // Primary corporate navy (buttons, active states, accents)
          navy:        '#003DA5',
          'navy-dark': '#002780',
          'navy-light':'#0050CC',
          // Brand red (logo only)
          red:         '#CC0000',
          'red-dark':  '#A80000',
          // Neutrals
          dark:        '#1A1A1A',
          'gray-text': '#6B7280',
          light:       '#F5F7FA',
          border:      '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 4px 0 rgba(0,0,0,0.08)',
        'nav':  '0 1px 0 0 #E5E7EB',
      },
    },
  },
  plugins: [],
}
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    { pattern: /bg-uob-/ },
    { pattern: /text-uob-/ },
    { pattern: /border-uob-/ },
    { pattern: /ring-uob-/ },
  ],
  theme: {
    extend: {
      colors: {
        uob: {
          navy:        '#003DA5',
          'navy-dark': '#002780',
          'navy-light':'#0050CC',
          red:         '#CC0000',
          'red-dark':  '#A80000',
          dark:        '#1A1A1A',
          'gray-text': '#6B7280',
          light:       '#F5F7FA',
          border:      '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 4px 0 rgba(0,0,0,0.08)',
        'nav':  '0 1px 0 0 #E5E7EB',
      },
    },
  },
  plugins: [],
}

export default config
