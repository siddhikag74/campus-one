/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B4CF0',
          hover: '#4A3CE0',
          light: '#EEF0FD',
          dark: '#382BB5',
        },
        campusBg: '#F1F3F8',
        surface: '#FFFFFF',
        accent: {
          events: '#5B4CF0',
          competitions: '#F59E0B',
          workshops: '#10B981',
          others: '#F43F5E',
        }
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px -2px rgba(91, 76, 240, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(91, 76, 240, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
        'phone': '0 25px 60px -15px rgba(15, 23, 42, 0.6), 0 0 0 12px #1E293B, 0 0 0 14px #0F172A',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
