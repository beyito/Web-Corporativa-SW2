/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad de Kallpa Software (distinta de la UAGRM)
        tinta: { 950: '#0B1220', 900: '#111A2E', 800: '#1C2740', 700: '#2A3756' },
        kallpa: { 50: '#EEFBF8', 100: '#D3F4EC', 300: '#6FDCC4', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E' },
        sol: { 400: '#FBBF24', 500: '#F59E0B' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
