import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		passWithNoTests: true,
		coverage: {
			provider: "v8",
			reportOnFailure: true,
			// TODO: Remove this once https://github.com/vitest-dev/vitest/issues/5856 is fixed
			all: false,
			exclude: [
				...coverageConfigDefaults.exclude,
				"**/__test__/**/*",
				"**/__tests__/**/*",
				"**/__mocks__/**/*",
				"**/test/**/*",
				"**/tests/**/*",
			],
		},
	},
});
