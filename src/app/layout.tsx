import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "context-visualizer",
  description: "A visual, editable view of what an AI remembers about you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
