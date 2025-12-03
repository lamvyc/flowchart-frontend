/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    // 扫描所有 .vue 文件和 .tsx 文件
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
