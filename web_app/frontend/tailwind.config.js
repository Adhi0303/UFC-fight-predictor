/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surfaceDark: 'rgb(var(--color-surface-dark) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        borderDark: 'rgb(var(--color-border-dark) / <alpha-value>)',
        textPrimary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        textSecondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        textMuted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        textInverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        textInverseMuted: 'rgb(var(--color-text-inverse-muted) / <alpha-value>)',
        
        ufcRed: 'rgb(var(--color-ufc-red) / <alpha-value>)',
        ufcBlack: 'rgb(var(--color-ufc-black) / <alpha-value>)',
        ufcGrey: 'rgb(var(--color-ufc-grey) / <alpha-value>)',
        
        redCorner: 'rgb(var(--color-red-corner) / <alpha-value>)',
        blueCorner: 'rgb(var(--color-blue-corner) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        // For heavy UFC style headers
        heading: ['"Space Grotesk"', 'sans-serif'], 
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
