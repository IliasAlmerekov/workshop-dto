import type { ReactNode } from "react";
import { en } from "@/lib/i18n/en";

/**
 * The page itself is a client component (it reads the interface locale), so
 * its static metadata lives here. A static export ships one HTML file for
 * every reader, so the exported title is the English source; the page
 * corrects `document.title` once the stored locale is known.
 */
export const metadata = { title: en.meta.demoTitle };

export default function DemoLayout({ children }: { children: ReactNode }) {
  return children;
}
