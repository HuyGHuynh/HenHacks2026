import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 8080,
    strictPort: true,
    host: true,
    allowedHosts: true // This disables the host check for the preview server
  },
  server: {
    host: true,
    allowedHosts: true // Do this if you are using 'npm run dev' (not recommended for prod)
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        login: fileURLToPath(new URL("./login.html", import.meta.url)),
        dashboard: fileURLToPath(new URL("./dashboard.html", import.meta.url)),
        recipe: fileURLToPath(new URL("./recipe.html", import.meta.url)),
      },
    },
  },
});
