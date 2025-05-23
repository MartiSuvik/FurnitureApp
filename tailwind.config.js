/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF9F6',
        olive: '#B7C9A8',
        sage: '#D6E2C6',
        charcoal: '#2D2D2D',
        'soft-charcoal': '#2D2D2D',
        'olive-200': '#E0DCCF',
      },
      fontFamily: {
        sans: ['Poppins', 'Nunito', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
      },
    },
  },
  plugins: [],
};
