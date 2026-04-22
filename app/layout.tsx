import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngMaster.io – English Reading Practice",
  description: "Create and practice English reading and cloze tests.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
