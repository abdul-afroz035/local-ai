/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        claude: {
          coral: '#cc785c',
          'coral-hover': '#b5684e',
          'coral-subtle': 'rgba(204, 120, 92, 0.12)',
          'coral-border': 'rgba(204, 120, 92, 0.28)',
        },
        dark: {
          app: '#1e1e1e',
          sidebar: '#171716',
          surface: '#262624',
          'surface-hover': '#2f2f2c',
          msg: '#282826',
          code: '#141413',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        light: {
          app: '#fbfbfa',
          sidebar: '#f4f3ef',
          surface: '#ffffff',
          'surface-hover': '#eceae3',
          msg: '#f0eee6',
          code: '#f7f6f2',
          border: 'rgba(0, 0, 0, 0.08)'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace']
      }
    },
  },
  plugins: [],
}
