import type { PlaywrightTestArgs, TestFixture } from "@playwright/test";
import type { Interceptor } from "../types";
import { setupInterceptor } from "../client";

export interface InterceptorFixtures {
	server: Interceptor;
}

export function createInterceptorFixture(): [
	TestFixture<Interceptor, PlaywrightTestArgs>,
	{ scope: "test" },
] {
	return [
		// biome-ignore lint/correctness/noEmptyPattern: <explanation>
		async ({}, use) => {
			const server = await setupInterceptor();
			await use(server);
			await server.resetHandlers();
			await server.close();
		},
		{ scope: "test" },
	];
}
