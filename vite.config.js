import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, // Expose to local network / mobile devices
    port: 5173
  }
});
