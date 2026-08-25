import type { ReactNode } from "react";
import { en } from "@/lib/i18n/en";

/** See `app/demo/layout.tsx` — same reason. */
export const metadata = { title: en.meta.storyTitle };

export default function StoryLayout({ children }: { children: ReactNode }) {
  return children;
}
