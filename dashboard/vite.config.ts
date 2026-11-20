import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' para que el build funcione desde cualquier subruta.
// En desarrollo, Vite y Uvicorn corren por separado: el proxy envia /api al backend.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
