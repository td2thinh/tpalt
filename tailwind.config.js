/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        reddit: {
          orange: '#FF4500',
          orangeHover: '#E03D00',
          red: '#FF0000',
          redHover: '#E00000',
          blue: '#0079D3',
          blueHover: '#006BC0',
          lightblue: '#D7DFE2',
          gray: '#DAE0E6',
          darkgray: '#1A1A1B',
          navbar: '#1A1A1B',
          highlight: '#272729',
          border: '#343536',
          text: '#D7DADC',
          muted: '#818384',
          canvas: '#030303',
          input: '#272729',
          upvote: '#FF8b60',
          downvote: '#9494FF',
        },
      },
      fontFamily: {
        reddit: ['IBM Plex Sans', 'sans-serif']
      },
    },
  },
  plugins: [],
}