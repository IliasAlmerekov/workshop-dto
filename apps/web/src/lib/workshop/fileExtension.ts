import type { Language } from "./types";

const EXTENSIONS: Record<Language, string> = {
  typescript: "ts",
  php: "php",
  python: "py",
  java: "java",
};

export function fileExtension(language: Language): string {
  return EXTENSIONS[language];
}
