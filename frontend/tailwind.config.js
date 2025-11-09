/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New Color Palette
        // #1D1616 - Very dark gray/almost black
        // #8E1616 - Dark red/maroon
        // #D84040 - Medium vibrant red
        // #EEEEEE - Very light gray/off-white
        primary: {
          DEFAULT: '#D84040', // Medium vibrant red #D84040
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#D84040', // Vibrant red #D84040
          600: '#8E1616', // Dark red/maroon #8E1616
          700: '#7A1212',
          800: '#660E0E',
          900: '#1D1616', // Very dark gray/black #1D1616
        },
        // Exact palette colors
        palette: {
          dark: '#1D1616', // Very dark gray/almost black
          'dark-red': '#8E1616', // Dark red/maroon
          'vibrant-red': '#D84040', // Medium vibrant red
          'light-gray': '#EEEEEE', // Very light gray/off-white
        },
        // Dark colors
        dark: {
          DEFAULT: '#1D1616',
          50: '#EEEEEE',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#B3B3B3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1D1616',
        },
        // Monotone greys based on new palette
        mono: {
          50: '#EEEEEE', // Very light gray
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#B3B3B3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1D1616', // Very dark gray/almost black
          950: '#0A0A0A',
        },
        // Accent colors
        accent: {
          light: '#D84040', // Medium vibrant red
          DEFAULT: '#8E1616', // Dark red/maroon
          dark: '#1D1616', // Very dark
        },
      },
      fontFamily: {
        sans: ['Fira Code', 'JetBrains Mono', 'monospace'],
        display: ['Fira Code', 'JetBrains Mono', 'monospace'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #E5E5E5 1px, transparent 1px), linear-gradient(to bottom, #E5E5E5 1px, transparent 1px)',
        'grid-pattern-dense': 'linear-gradient(to right, #E5E5E5 0.5px, transparent 0.5px), linear-gradient(to bottom, #E5E5E5 0.5px, transparent 0.5px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
        'grid-dense': '20px 20px',
      },
    },
  },
  plugins: [],
}
