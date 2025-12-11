import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-geist-sans)'],
                mono: ['var(--font-geist-mono)'],
                serif: ['var(--font-serif)'],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Custom Theme
                'bg-primary': '#0f0e13',
                'bg-secondary': '#1a1923',
                'bg-tertiary': '#272533',
                'text-primary': '#f0f0f5',
                'text-secondary': '#a0a0b0',
                'text-muted': '#666677',
                'accent-primary': '#b7a6f6',
                'accent-secondary': '#d4af37',
                'glass-border': 'rgba(255, 255, 255, 0.08)',
                'glass-bg': 'rgba(26, 25, 35, 0.7)',
            },
        },
    },
    plugins: [],
};
export default config;
