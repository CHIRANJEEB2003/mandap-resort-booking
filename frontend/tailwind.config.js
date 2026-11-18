/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Public accent
        pink: {
          50:  '#FEF0F7',
          100: '#FDD5EC',
          200: '#FBA9D7',
          300: '#F77DBC',
          400: '#F051A1',
          DEFAULT: '#E83E8C',
          500: '#E83E8C',
          600: '#CE2673',
          700: '#A81A5B',
          800: '#7E1244',
          900: '#540C2E',
        },
        // Brand palette: cream-white, dark-green, gold
        cream: {
          50:  '#FDFCF7',
          100: '#FAF8EF',
          200: '#F5F0DF',
        },
        forest: {
          50:  '#F2F7ED',
          100: '#D9EBC6',
          200: '#B3D48E',
          300: '#7FB855',
          400: '#4E952E',
          500: '#2D5016',
          600: '#1E3B0E',
          700: '#142808',
          800: '#0C1A05',
          900: '#060D02',
        },
        gold: {
          50:  '#FEF9ED',
          100: '#FBE9B5',
          200: '#F7D880',
          300: '#F0C96B',
          400: '#E8B84B',
          500: '#D4982A',
          600: '#B8721A',
          700: '#8C520F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 4px 0 rgba(0,0,0,0.06), 0 4px 16px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.10), 0 8px 32px 0 rgba(0,0,0,0.06)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
};
