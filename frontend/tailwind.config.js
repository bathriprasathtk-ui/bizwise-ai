/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        page: 'var(--color-page)',
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        line: 'var(--color-line)',
        heading: 'var(--color-heading)',
        body: 'var(--color-body)',
        subtle: 'var(--color-subtle)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px -20px rgba(15, 23, 42, 0.28)',
        lift: '0 2px 4px rgba(15, 23, 42, 0.05), 0 24px 48px -28px rgba(15, 23, 42, 0.35)',
      },
      maxWidth: {
        content: '1120px',
      },
    },
  },
  plugins: [],
};
