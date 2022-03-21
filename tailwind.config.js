const colors = require('tailwindcss/colors')

module.exports = {
  important: 'body>div#root',
  purge: [
    './src/components/**/*.jsx',
    './src/assets/styles/**/*.css'
  ],
  dark: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        teal: colors.teal,
        cyan: colors.cyan,
      },
      animation: {
        jiggle: 'jiggle 0.2s ease-in-out infinite',
        'flash-red': 'flash-red 0.2s linear infinite',
        'flash-green': 'flash-green 0.2s linear infinite'
      },
      boxShadow: {
        focus: '0 0 0 3px rgba(66, 153, 225, 0.5)',
      },
      height: {
        fill: '-webkit-fill-available',
        '124': '31rem'
      },
      inset: {
        half: '50%',
        full: '100%',
      },
      keyframes: {
        jiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        'flash-red': {
          '0%': { backgroundColor: 'rgb(239, 68, 68)' },
          '49.999%': { backgroundColor: 'rgb(239, 68, 68)' },
          '50%': { backgroundColor: 'transparent' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-green': {
          '0%': { backgroundColor: 'rgb(16, 185, 129)' },
          '24.999%': { backgroundColor: 'rgb(16, 185, 129)' },
          '25%': { backgroundColor: 'transparent' },
          '49.999%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgb(16, 185, 129)' },
          '74.999%': { backgroundColor: 'rgb(16, 185, 129)' },
          '75%': { backgroundColor: 'transparent' },
          '100%': { backgroundColor: 'transparent' },
        }
      },
      maxHeight: {
        '1/2': '50%',
        '124': '31rem',
        'fit-borders': 'calc(100vh - 120px)'
      },
      maxWidth: {
        '1/2': '50%'
      },
      minHeight: {
        fit: 'fit-content'
      },
      minWidth: {
        fit: 'fit-content'
      },
      rotate: {
        '-135': '-135deg',
        '135': '135deg'
      },
      screens: {
        'print': {'raw': 'print'},
      },
      width: {
        fill: '-webkit-fill-available',
        fit: 'fit-content'
      },
      zIndex: {
        '-10': '-10',
        '100': '100'
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['odd'],
      borderRadius: ['first', 'last'],
      display: ['group-hover'],
      margin: ['first', 'last'],
      padding: ['first', 'last'],
      textColor: ['odd'],
    }
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
};
