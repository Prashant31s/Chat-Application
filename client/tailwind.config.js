/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
    'text': '#0d080b',
    'text2':'#FFFFFF',
    'background': '#faf6f8',
    'primary': '#b18bb0',
    'secondary': '#a1a1aa',
    'accent': '#b69d8b',
    'heading':'#000000',
    'joinbutton':'#3b82f6',
    'joinbutton2':'#1e40af',
    'red' :'#FF0000'
     },
    extend: {},
  },

  plugins: [],
}