import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development the React dev server (5173) proxies /api calls to the
// Express backend (4000), so the frontend code can just call "/api/...".
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
