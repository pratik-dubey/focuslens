/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        brand: {
          yellow:  '#FFE500',
          black:   '#0A0A0A',
          white:   '#FAFAFA',
          purple:  '#7C3AED',
          pink:    '#FF3EA5',
          green:   '#00C853',
          orange:  '#FF6B00',
          blue:    '#0066FF',
        }
      },
      boxShadow: {
        'brutal':    '4px 4px 0px #0A0A0A',
        'brutal-lg': '6px 6px 0px #0A0A0A',
        'brutal-xl': '8px 8px 0px #0A0A0A',
        'brutal-sm': '2px 2px 0px #0A0A0A',
        'brutal-inset': 'inset 3px 3px 0px #0A0A0A',
      },
      borderWidth: { '3': '3px' },
      animation: {
        'marquee': 'marquee 20s linear infinite',
        'pulse-brutal': 'pulse-brutal 2s ease-in-out infinite',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0%)' }, '100%': { transform: 'translateX(-50%)' } },
        'pulse-brutal': { '0%,100%': { boxShadow: '4px 4px 0px #0A0A0A' }, '50%': { boxShadow: '6px 6px 0px #0A0A0A' } },
      }
    },
  },
  plugins: [],
}
