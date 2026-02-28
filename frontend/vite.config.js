import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  }
})