/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        mist: '#eef4f3',
        surf: '#f8fafc',
        pine: '#0f766e',
        skyglass: '#d8f1ef',
        coral: '#fb7185',
        gold: '#f59e0b'
      },
      boxShadow: {
        soft: '0 18px 45px -22px rgba(15, 23, 42, 0.28)'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at top, rgba(15, 118, 110, 0.12), transparent 42%), linear-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.06) 1px, transparent 1px)'
      }
    }
  },
  plugins: []
};
