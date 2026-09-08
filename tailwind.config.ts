import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      colors: {
        scruttin: {
          base: 'rgb(var(--scruttin-base) / <alpha-value>)',
          surface: 'rgb(var(--scruttin-surface) / <alpha-value>)',
          border: 'rgb(var(--scruttin-border) / <alpha-value>)',
          text: 'rgb(var(--scruttin-text) / <alpha-value>)',
          muted: 'rgb(var(--scruttin-muted) / <alpha-value>)',
          accent: 'rgb(var(--scruttin-accent) / <alpha-value>)',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'scrutEnter 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
