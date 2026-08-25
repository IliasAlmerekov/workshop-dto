import type { Language } from "@/lib/workshop/types";

/**
 * The hero's track cards, in the reference's own order — which is not
 * `LANGUAGES`' order. `LANGUAGES` is the storage and validation order and must
 * not be reshuffled to suit a screen; this list owns presentation only.
 *
 * Logo dimensions are the measured Figma sizes inside the shared 82 × 66 logo
 * slot, and `width` is each card's measured width. The four are deliberately
 * uneven: they hug their content, and evening them into a grid loses the
 * reference's rhythm (DESIGN.md, Do's and Don'ts).
 */
export type Track = {
  language: Language;
  label: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
  width: number;
};

export const TRACKS: readonly Track[] = [
  {
    language: "java",
    label: "Java",
    logo: "/icons/java.png",
    logoWidth: 56,
    logoHeight: 64,
    width: 195,
  },
  {
    language: "python",
    label: "Python",
    logo: "/icons/python.png",
    logoWidth: 60,
    logoHeight: 60,
    width: 216,
  },
  {
    language: "php",
    label: "PHP",
    logo: "/icons/php.png",
    logoWidth: 82,
    logoHeight: 44,
    width: 216,
  },
  {
    language: "typescript",
    label: "TypeScript",
    logo: "/icons/typescript.png",
    logoWidth: 58,
    logoHeight: 58,
    width: 213,
  },
];
