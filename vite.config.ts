import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base: '/game-capi-shadow-missions/', plugins: [react()], build: {chunkSizeWarningLimit: 1500}});
