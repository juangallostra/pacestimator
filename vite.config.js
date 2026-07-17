import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['pacestimator.onrender.com'],
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    allowedHosts: ['pacestimator.onrender.com'],
  },
});
