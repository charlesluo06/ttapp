import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, send /api requests to the backend on port 3000.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
