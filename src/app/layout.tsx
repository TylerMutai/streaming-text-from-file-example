import type { Metadata } from "next";
import { Playfair } from "next/font/google";
import "./globals.css";

const inter = Playfair({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A Streaming Example",
  description: "Streaming a log file's contents to the browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}