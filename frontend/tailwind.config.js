/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#effafa',
          100: '#d6f1f2',
          200: '#afe3e5',
          300: '#7ecdd1',
          400: '#4ab0b7',
          500: '#2c919a',
          600: '#1f7882',
          700: '#0d676f',
          800: '#0c505a',
          900: '#0a3f48',
          DEFAULT: '#0d676f',
        },
        accent: {
          50:  '#fff7ea',
          100: '#ffebc7',
          200: '#fed588',
          300: '#fdc266',
          400: '#fcb34d',
          500: '#fb9c2c',
          600: '#ee7d18',
          700: '#c55e14',
          800: '#9c4914',
          900: '#7e3d14',
          DEFAULT: '#fcb34d',
        },
        ink: {
          50:  '#f7faf9',
          200: '#e2e8e9',
          500: '#6b7a7d',
          700: '#2a3a3d',
          900: '#0a1a1c',
        },
        success: { 500: '#22c55e' },
        warning: { 500: '#f59e0b' },
        danger:  { 500: '#ef4444' },
        info:    { 500: '#3b82f6' },
        surface: '#ffffff',
      },

      fontFamily: {
        // Q1: Surgena mis en attente (licence "personalUseOnly"), font-heading retombe sur Bricolage SemiBold via font-weight.
        display: ['"Pogonia"', 'serif'],
        heading: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body:    ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        // [size, { lineHeight, letterSpacing }]
        'display-xl':      ['2.5rem',  { lineHeight: '1.1',  letterSpacing: '-0.02em' }],   // 40px mobile
        'display-xl-md':   ['3.5rem',  { lineHeight: '1.05', letterSpacing: '-0.02em' }],   // 56px desktop
        'display-lg':      ['2rem',    { lineHeight: '1.15', letterSpacing: '-0.015em' }], // 32px mobile
        'display-lg-md':   ['2.75rem', { lineHeight: '1.1',  letterSpacing: '-0.015em' }], // 44px desktop
        'h1':              ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],  // 28px mobile
        'h1-md':           ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.01em' }],  // 36px desktop
        'h2':              ['1.375rem',{ lineHeight: '1.3',  letterSpacing: '-0.005em' }], // 22px mobile
        'h2-md':           ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.005em' }], // 28px desktop
        'h3':              ['1.125rem',{ lineHeight: '1.35' }],                            // 18px mobile
        'h3-md':           ['1.25rem', { lineHeight: '1.3' }],                             // 20px desktop
        'body-lg':         ['1rem',    { lineHeight: '1.6' }],                             // 16px mobile
        'body-lg-md':      ['1.125rem',{ lineHeight: '1.6' }],                             // 18px desktop
        'body':            ['0.875rem',{ lineHeight: '1.55' }],                            // 14px mobile
        'body-md':         ['1rem',    { lineHeight: '1.55' }],                            // 16px desktop
        'caption':         ['0.75rem', { lineHeight: '1.4',  letterSpacing: '0.02em' }],   // 12px
      },

      borderRadius: {
        // Tailwind defaults : xl=12px, 2xl=16px → conformes au design system
        '4xl': '2rem',
      },

      boxShadow: {
        soft:     '0 2px 8px rgba(13, 103, 111, 0.06)',
        card:     '0 8px 24px rgba(13, 103, 111, 0.08)',
        elevated: '0 16px 40px rgba(13, 103, 111, 0.12)',
        glow:     '0 0 0 4px rgba(252, 179, 77, 0.25)',
      },

      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.85', transform: 'scale(1.06)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        shake:        'shake 0.4s ease-in-out',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        shimmer:      'shimmer 1.8s linear infinite',
        'fade-in-up': 'fade-in-up 0.35s ease-out both',
      },

      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
