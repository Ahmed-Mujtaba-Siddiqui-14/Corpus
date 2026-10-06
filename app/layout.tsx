import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corpus — Interactive Human Anatomy",
  description: "Explore seven human body systems in 3D with clickable anatomy, animated processes and guided lessons.",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.svg`,
    shortcut: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
