import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
	webServer: {
		command: "bun vite build --mode test && bun vite preview --mode test",
		port: 4173,
	},
	use: {
		baseURL: "http://localhost:4173/",
		trace: "on",
	},
	testDir: "tests",
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	reporter: [["html", { outputFolder: "./tests/report", open: "on-failure" }]],
};

export default config;
