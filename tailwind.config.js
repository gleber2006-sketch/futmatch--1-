/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx"
    ],
    theme: {
        extend: {
            colors: {
                'neon-green': '#00FF94', // Verde vibrante principal
                'neon-blue': '#00C2FF',  // Azul vibrante secundário (opcional)
                'dark-navy': '#0a1628',  // Fundo principal
                'dark-surface': '#112240', // Fundo de cards/elementos
                'glass-white': 'rgba(255, 255, 255, 0.1)', // Efeito vidro
            },
            fontFamily: {
                sans: ['Poppins', 'Inter', 'sans-serif'],
            },
            boxShadow: {
                'neon': '0 0 10px rgba(0, 255, 148, 0.5)',
                'neon-hover': '0 0 20px rgba(0, 255, 148, 0.7)',
            }
        },
    },
    plugins: [],
}
