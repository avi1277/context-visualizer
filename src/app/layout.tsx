import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "context-visualizer",
  description: "A visual, editable view of what an AI remembers about you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={newsreader.variable}>
      <body>{children}</body>
    </html>
  );
}
