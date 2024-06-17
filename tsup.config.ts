import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "./src/index.ts",
		"node/index": "./src/node.ts",
		"playwright/index": "./src/playwright.ts",
	},
	format: ["esm"],
	platform: "node",
	clean: true,
	dts: true,
	external: ["msw", "@playwright/test", "stream", "node:stream"],
	noExternal: ["ws", "esbuild", "serialize-javascript", "zod"],
	minify: false,
	inject: ["./cjs-shim.ts"],
});
