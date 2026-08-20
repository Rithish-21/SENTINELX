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
        cyber: {
          bg: '#0A0F1D',
          bgDark: '#060913',
          surface: '#111C33',
          surfaceLight: '#182747',
          surfaceBorder: '#1F3158',
          cyan: '#00D2D3',
          cyanDark: '#009b9c',
          magenta: '#FF2E93',
          magentaDark: '#cc1c6f',
          amber: '#F59E0B',
          emerald: '#10B981',
          violet: '#8B5CF6',
          textMuted: '#8E9EB8',
          textBright: '#E2EDF8',
        }
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(0, 210, 211, 0.35)',
        'cyan-glow-lg': '0 0 25px rgba(0, 210, 211, 0.5)',
        'magenta-glow': '0 0 18px rgba(255, 46, 147, 0.45)',
        'magenta-glow-lg': '0 0 35px rgba(255, 46, 147, 0.65)',
        'amber-glow': '0 0 15px rgba(245, 158, 11, 0.4)',
        'emerald-glow': '0 0 15px rgba(16, 185, 129, 0.4)',
        'cyber-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'alert-strobe': 'alertStrobe 1s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'radar': 'radar 4s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        alertStrobe: {
          '0%, 100%': { borderColor: 'rgba(255, 46, 147, 0.9)', boxShadow: '0 0 25px rgba(255, 46, 147, 0.6)' },
          '50%': { borderColor: 'rgba(255, 46, 147, 0.3)', boxShadow: '0 0 10px rgba(255, 46, 147, 0.2)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
