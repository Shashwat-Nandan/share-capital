import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cap Table Studio — Share Capital Playground for Indian Startups",
  description:
    "An interactive playground for understanding authorised capital, paid-up capital, valuations, founder infusions and ESOPs for a private limited company in India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
