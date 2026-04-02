/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pastelBlue: '#dbeafe',
        pastelPink: '#fce7f3',
        pastelGreen: '#dcfce7'
      }
    }
  },
  plugins: []
};
