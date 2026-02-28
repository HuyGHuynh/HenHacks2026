import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
