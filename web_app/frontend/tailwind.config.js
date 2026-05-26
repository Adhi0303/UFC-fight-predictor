/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0C10",
        surface: "#1F2833",
        redCorner: "#EF4444",
        blueCorner: "#3B82F6",
        gold: "#E5A93B",
        textPrimary: "#F3F4F6",
        textSecondary: "#9CA3AF"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.3)',
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.3)',
      }
    },
  },
  plugins: [],
}
