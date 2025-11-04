/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "uw-red": "#CD1543",
                "uw-gold": "#FFD74F",
                "uw-navy": "#231F20",
            },
        },
    },
    plugins: [],
}
