/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          primary: '#163A2D',
          supporting: '#16845B',
          accent: '#84CC16',
          bg: '#F6F8F6',
          surface: '#FFFFFF',
          text: '#18231F',
          muted: '#64716A',
          border: '#E1E8E2',
          error: '#B42318',
          warning: '#B7791F',
        },
        primary: {
          DEFAULT: '#163A2D',
          light: '#205140',
        },
        secondary: {
          DEFAULT: '#16845B',
          light: '#239B6D',
        },
        accent: {
          DEFAULT: '#84CC16',
          hover: '#65A30D',
        },
        background: '#F6F8F6',
        surface: '#FFFFFF',
        foreground: '#18231F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(22, 58, 45, 0.05)',
        'card': '0 1px 3px 0 rgba(22, 58, 45, 0.06), 0 1px 2px 0 rgba(22, 58, 45, 0.04)',
        'elevated': '0 10px 25px -3px rgba(22, 58, 45, 0.08), 0 4px 6px -2px rgba(22, 58, 45, 0.04)',
      }
    },
  },
  plugins: [],
};
