import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  server: { port: 5173, strictPort: true },
  preview: { port: 4174, strictPort: true },
  build: { target: "es2022" },
});
