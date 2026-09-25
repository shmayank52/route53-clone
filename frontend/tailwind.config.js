/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        awsSquid: "#232f3e",      // top nav dark navy
        awsSquidLight: "#31465f", // sidebar navy
        awsOrange: "#ff9900",
        awsBlue: "#0972d3",
        awsBg: "#f2f3f3",
        awsBorder: "#d5dbdb",
        awsText: "#16191f",
        awsGray: "#5f6b7a",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
