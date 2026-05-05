import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngMaster.io – English Reading Practice",
  description: "Create and practice English reading and cloze tests.",
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ 
            style: { 
              background: 'var(--bg-card)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border)' 
            } 
          }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
