import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
const devProxy = {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
  '/uploads': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
  '/socket.io': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    ws: true,
    secure: false,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: devProxy,
  },
  preview: {
    port: 3000,
    proxy: devProxy,
  },
})