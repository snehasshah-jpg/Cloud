/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8eef7',
          100: '#c5d5ea',
          200: '#9fb9dc',
          300: '#789dce',
          400: '#5a88c3',
          500: '#3c73b8',
          600: '#2e5d99',
          700: '#1e3a5f',
          800: '#162c4a',
          900: '#0d1e35',
        },
        green: {
          match: '#16a34a',
          light: '#dcfce7',
        },
        yellow: {
          match: '#d97706',
          light: '#fef3c7',
        },
        blue: {
          match: '#2563eb',
          light: '#dbeafe',
        },
        gray: {
          match: '#6b7280',
          light: '#f3f4f6',
        },
      },
    },
  },
  plugins: [],
};
