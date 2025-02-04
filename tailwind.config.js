module.exports = {
  mode: 'jit',
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'], // remove unused styles in production
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: '#0053FF',
          100: '#A3C9FF',
          200: '#7AAEFF',
          300: '#5993FF',
          400: '#4178FF',
          500: '#2665FF',
          600: '#0053FF',
          700: '#0047E6',
          800: '#003BCC',
          900: '#002FB3',
        },
        sky: {
          DEFAULT: '#00E6D9',
          100: '#B3FFFF',
          200: '#80FFFF',
          300: '#4DFFFF',
          400: '#48FFFC',
          500: '#00E6D9',
          600: '#00B3B3',
          700: '#008080',
          800: '#006666',
          900: '#004D4D',
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
