import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { WorkshopProvider } from "@/lib/workshop/WorkshopContext";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DTO & Mapper Workshop",
  description: "Browser-based DTO and mapper workshop for junior developers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme script stamps data-theme onto <html> before React hydrates,
    // so that attribute is expected to differ from the server markup.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <WorkshopProvider>{children}</WorkshopProvider>
      </body>
    </html>
  );
}
