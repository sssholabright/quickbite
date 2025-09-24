import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: '0.0.0.0'
    },
    build: {
        outDir: 'dist'
    },
    esbuild: {
        // Skip type checking during build
        logOverride: { 'this-is-undefined-in-esm': 'silent' }
    }
})