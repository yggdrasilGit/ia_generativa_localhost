import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/auth': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/users': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/projects': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/conversations': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/messages': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/settings': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/sessions': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/audit': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/backup': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/history': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/documents': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/rag': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/ws': {
                target: 'ws://localhost:8000',
                ws: true,
            },
        },
    },
})

