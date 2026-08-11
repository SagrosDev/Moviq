import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), react()],
  envPrefix: "VITE_CLIENT_",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        root: resolve(projectRoot, "index.html"),
        es: resolve(projectRoot, "es/index.html"),
        en: resolve(projectRoot, "en/index.html")
      }
    }
  }
});
