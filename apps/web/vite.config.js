import { defineConfig } from "vite";
import { readFileSync } from "node:fs";

// Inline Solar icons (Iconify, solar set, CC BY 4.0 · 480 Design) from src/icons at build time.
function inlineIcons() {
  return {
    name: "inline-solar-icons",
    transformIndexHtml(html) {
      return html.replace(/<i data-icon="([a-z0-9-]+)"><\/i>/g, (_, name) => {
        const svg = readFileSync(new URL(`./src/icons/${name}.svg`, import.meta.url), "utf8");
        return svg.replace("<svg ", '<svg class="icon" aria-hidden="true" focusable="false" ');
      });
    },
  };
}

export default defineConfig({
  plugins: [inlineIcons()],
  build: { target: "es2020", assetsInlineLimit: 0 },
});
