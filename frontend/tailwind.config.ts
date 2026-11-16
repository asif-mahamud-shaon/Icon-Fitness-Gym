import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#090909',
        charcoal: '#171717',
        surface: '#242424',
        elevated: '#2E2E2E',
        lime: {
          DEFAULT: '#C7F464',
          hover: '#D4F882',
          muted: 'rgba(199, 244, 100, 0.14)',
        },
        border: {
          muted: '#303030',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      maxWidth: {
        container: '1360px',
      },
    },
  },
  plugins: [],
};

export default config;

