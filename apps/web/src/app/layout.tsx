import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { WorkshopProvider } from "@/lib/workshop/WorkshopContext";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { LOCALE_INIT_SCRIPT } from "@/lib/i18n/locale";
import { LocaleProvider } from "@/lib/i18n";
import { INTRO_INIT_SCRIPT } from "@/lib/intro";
import "./globals.css";

/**
 * DESIGN.md's two typefaces. `next/font/google` self-hosts both at build time,
 * which is why `theme.css` carries no `@import url(...)` — nothing reaches a
 * font CDN at runtime. `globals.css` points the theme's `--font-inter` and
 * `--font-mono` at the two variables declared here.
 */
const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DTO & Mapper Workshop",
  description: "Browser-based DTO and mapper workshop for junior developers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: INTRO_INIT_SCRIPT }} />
      </head>
      <body>
        <LocaleProvider>
          <WorkshopProvider>{children}</WorkshopProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
