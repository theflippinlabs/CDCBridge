/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Black obsidian background palette
        obsidian: {
          950: '#050608',
          900: '#0a0c10',
          850: '#0f1218',
          800: '#141821',
          700: '#1c212d',
          600: '#262d3b',
        },
        // Platinum / silver UI
        platinum: {
          50: '#f7f8fa',
          100: '#e9ecf1',
          200: '#cdd3dd',
          300: '#aab3c2',
          400: '#8893a6',
        },
        // Electric blue accent
        electric: {
          400: '#3da9fc',
          500: '#1e8fff',
          600: '#0a72e6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(30,143,255,0.25), 0 8px 30px rgba(30,143,255,0.08)',
      },
    },
  },
  plugins: [],
};
