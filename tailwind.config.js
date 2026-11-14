/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B1115',
        surface: '#121B20',
        raised: '#17232A',
        line: '#253239',
        fg: '#E7EDF0',
        fg2: '#A7B4BC',
        fg3: '#8796A0',
        accent: '#4B9C96',
        ok: '#65B89A',
        warn: '#D8AA58',
        bad: '#E8866F',
        info: '#83A9D2',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
