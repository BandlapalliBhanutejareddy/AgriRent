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
        primary: {
          DEFAULT: '#163A2D',
          light: '#205140',
        },
        secondary: {
          DEFAULT: '#2F6B4F',
          light: '#3C8A65',
        },
        accent: {
          DEFAULT: '#84CC16',
          hover: '#65A30D',
        },
        background: '#F8FAF8', // warm/light neutral agricultural background
        foreground: '#1F2937', // dark charcoal text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(22, 58, 45, 0.05)',
      }
    },
  },
  plugins: [],
};
