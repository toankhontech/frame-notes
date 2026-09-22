import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Vite gives this same asset a content-hashed URL. Hash it once at build time
// instead of downloading the complete demo again when exporting a review.
const demo = readFileSync(new URL("./src/assets/demo.mp4", import.meta.url));
export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    __DEMO_FINGERPRINT__: JSON.stringify({
      algorithm: "SHA-256",
      digest: createHash("sha256").update(demo).digest("hex"),
      byteLength: demo.byteLength,
    }),
  },
});
