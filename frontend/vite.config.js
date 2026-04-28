import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Frontend is served from /frontend/ (this folder)
  // When calling PHP APIs, we use absolute paths in code (for now).
  server: {
    port: 5173,
    strictPort: true,
  },
});

