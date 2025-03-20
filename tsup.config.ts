import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  sourcemap: true,
  clean: true,
  minify: true,
  cjsInterop: true,
  dts: true,
  treeshake: true,
});
