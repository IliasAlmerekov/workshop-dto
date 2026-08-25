import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * The deck ships as one HTML file. It is shown from a USB stick on a room's
 * interactive whiteboard, so nothing may be fetched at runtime — not a font,
 * not a stylesheet. `assetsInlineLimit` is raised past the largest woff2 so the
 * two typefaces land as data URIs inside that single file.
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { assetsInlineLimit: 4 * 1024 * 1024, cssCodeSplit: false },
});
