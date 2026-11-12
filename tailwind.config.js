/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
        onprimary: 'rgb(var(--c-on-primary) / <alpha-value>)',
        onsecondary: 'rgb(var(--c-on-secondary) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        canvas: '#F8FAFC',
        ink: '#1E293B',
      },
      fontFamily: {
        sans: ['var(--font)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 2px 8px -2px rgb(15 23 42 / 0.06)',
        lift: '0 2px 4px rgb(15 23 42 / 0.04), 0 12px 24px -8px rgb(15 23 42 / 0.12)',
        pop: '0 24px 48px -12px rgb(15 23 42 / 0.25), 0 4px 12px rgb(15 23 42 / 0.06)',
        ring: '0 0 0 1px rgb(15 23 42 / 0.06)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' } },
        'sheet-up': { from: { transform: 'translateY(100%)' } },
        'drawer-in': { from: { transform: 'translateX(100%)' } },
        draw: { from: { strokeDashoffset: '48' }, to: { strokeDashoffset: '0' } },
        pulse: { '50%': { opacity: '.45' } },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
        'fade-up': 'fade-up 280ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'scale-in': 'scale-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'sheet-up': 'sheet-up 360ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'drawer-in': 'drawer-in 360ms cubic-bezier(0.32, 0.72, 0, 1) both',
        draw: 'draw 420ms 120ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'soft-pulse': 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
