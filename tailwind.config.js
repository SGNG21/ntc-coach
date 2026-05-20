/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        navy: {
          50: '#e8f1f8',
          100: '#c5d9ee',
          500: '#2d6a9f',
          700: '#1c3d5a',
          900: '#0d1f2d',
        },
        ccp1: {
          50: '#deeaf8',
          600: '#0f5298',
          900: '#072f5a',
        },
        ccp2: {
          50: '#f0e4f5',
          600: '#6b2d7e',
          900: '#3e1a4a',
        },
      },
      animation: {
        'bounce-slow': 'bounce 1.4s infinite',
      },
    },
  },
  plugins: [],
};
export default config;
