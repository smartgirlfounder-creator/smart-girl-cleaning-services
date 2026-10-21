import { defineConfig } from "vitest/config";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds to one self-contained dist/index.html so the game can be hosted anywhere
// (static hosting, an Artifact, or opened straight from disk).
export default defineConfig({
  plugins: [viteSingleFile()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
