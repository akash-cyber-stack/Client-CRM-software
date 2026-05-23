import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
