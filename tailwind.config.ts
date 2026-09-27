import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        editorial: ["var(--font-newsreader)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
