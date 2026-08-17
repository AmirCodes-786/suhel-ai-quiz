/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFA',
        foreground: '#0F172A',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F1F5F9',
          border: '#E2E8F0',
        },
        primary: {
          DEFAULT: '#4F46E5', // Clean Indigo
          hover: '#4338CA',
          light: '#EEF2FF',
          dark: '#3730A3',
        },
        secondary: {
          DEFAULT: '#0F172A',
          hover: '#1E293B',
        },
        accent: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 10px 15px -5px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
