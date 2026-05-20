/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        bg:       '#F7F8FC',
        surface:  '#FFFFFF',
        border:   '#E8ECF4',
        faint:    '#F1F3F9',
        ink:      '#111827',
        muted:    '#6B7280',
        subtle:   '#9CA3AF',
        brand: {
          DEFAULT: '#4F46E5',
          light:   '#EEF2FF',
          dark:    '#3730A3',
        },
        amber:    '#D97706',
        amberBg:  '#FFFBEB',
        emerald:  '#059669',
        emeraldBg:'#ECFDF5',
        cyan:     '#0891B2',
        cyanBg:   '#ECFEFF',
        rose:     '#E11D48',
        roseBg:   '#FFF1F2',
        violet:   '#7C3AED',
        violetBg: '#F5F3FF',
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.1)',
        focus:  '0 0 0 3px rgba(79,70,229,0.15)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
