import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "msw-ssr-interceptor",
		passWithNoTests: true,
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
});
