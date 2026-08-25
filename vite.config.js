import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/n8n-api': {
        target: 'https://mekan-mellz.app.n8n.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n-api/, ''),
      },
    },
  },
});