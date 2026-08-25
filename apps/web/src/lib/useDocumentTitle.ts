"use client";

import { useEffect } from "react";

/**
 * Keeps `document.title` in step with the interface language.
 *
 * Next's `metadata` export is evaluated on the server, where the visitor's
 * stored locale is unknown — a static export has one HTML file for every
 * reader. The exported `<title>` therefore stays the English default (the
 * right choice for crawlers and for a first paint), and this corrects it
 * once the locale is known.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
