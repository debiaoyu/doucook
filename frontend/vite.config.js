import { defineConfig } from 'vite';
var backendPort = process.env.DOUCOOK_BACKEND_PORT || '8899';
export default defineConfig({
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: "http://localhost:".concat(backendPort),
                changeOrigin: true,
            },
        },
    },
});
