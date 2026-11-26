import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true },
  build: {
    target: 'es2020',
    cssTarget: ['chrome90', 'safari15'],
  },
})
