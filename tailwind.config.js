/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0070F3',
          600: '#0066FF',
          700: '#0052CC',
          800: '#1E40AF',
          900: '#0F172A',
        },
        cyanBrand: {
          400: '#00D8F6',
          500: '#00C2E0',
          600: '#0099B8',
        },
        slateText: {
          heading: '#0F172A',
          body: '#475569',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 30px -5px rgba(0, 112, 243, 0.25)',
        'card-soft': '0 10px 25px -5px rgba(0, 102, 255, 0.04), 0 4px 10px -2px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
