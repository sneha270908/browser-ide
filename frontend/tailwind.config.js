/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // CodeForge Design System
        forge: {
          bg:       '#080c14',     // Deep space black
          surface:  '#0d1526',     // Card surface
          elevated: '#111d35',     // Elevated surface
          border:   '#1a2d50',     // Subtle border
          accent:   '#2563eb',     // Electric blue
          glow:     '#3b82f6',     // Glow blue
          cyan:     '#06b6d4',     // Cyan accent
          purple:   '#8b5cf6',     // Purple accent
          emerald:  '#10b981',     // Success
          amber:    '#f59e0b',     // Warning
          rose:     '#f43f5e',     // Error/Danger
          muted:    '#64748b',     // Muted text
          subtle:   '#94a3b8',     // Subtle text
          text:     '#e2e8f0',     // Primary text
          bright:   '#f8fafc',     // Bright white
        },
      },
      fontFamily: {
        sans:  ['Geist', 'system-ui', 'sans-serif'],
        mono:  ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #2563eb44' },
          '100%': { boxShadow: '0 0 20px #2563eb88, 0 0 40px #2563eb22' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern': `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 .5H31.5V32' stroke='%23ffffff05'/%3E%3C/svg%3E")`,
        'noise': `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      },
    },
  },
  plugins: [],
}
