/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#3b82f6', // blue-500
                    dark: '#2563eb',    // blue-600
                },
            },
        },
    },
    plugins: [],
}
