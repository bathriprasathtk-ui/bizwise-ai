/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefaf6',
          100: '#d3f3ea',
          200: '#a8e7d8',
          300: '#6fd4c1',
          400: '#35b8a5',
          500: '#14a08c',
          600: '#0d8272',
          700: '#0f766e',
          800: '#115e57',
          900: '#124d48',
        },
        ink: {
          950: '#081b24',
          900: '#0b1f2a',
          800: '#10303a',
          700: '#16414a',
          600: '#1f525c',
        },
        page: 'var(--color-page)',
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        line: 'var(--color-line)',
        heading: 'var(--color-heading)',
        body: 'var(--color-body)',
        subtle: 'var(--color-subtle)',
        positive: 'var(--color-positive)',
        attention: 'var(--color-attention)',
        risk: 'var(--color-risk)',
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
        display: ['Fraunces', 'Iowan Old Style', 'Georgia', 'Cambria', 'serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 35, 58, 0.04), 0 14px 32px -24px rgba(16, 35, 58, 0.35)',
        lift: '0 2px 6px rgba(16, 35, 58, 0.06), 0 28px 56px -32px rgba(16, 35, 58, 0.42)',
        panel: '0 24px 60px -40px rgba(8, 27, 36, 0.55)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      maxWidth: {
        content: '1200px',
      },
      letterSpacing: {
        eyebrow: '0.14em',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
