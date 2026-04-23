import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": src },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("date-fns")) return "datefns";
          if (id.includes("@dnd-kit")) return "dnd";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("scheduler")) {
            return "react-v";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://127.0.0.1:5001", changeOrigin: true },
    },
  },
});
