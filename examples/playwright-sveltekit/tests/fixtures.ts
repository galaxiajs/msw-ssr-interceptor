import { expect, test as playwrightTest } from "@playwright/test";
import { http, type Interceptor } from "msw-ssr-interceptor";
import { createInterceptorFixture } from "msw-ssr-interceptor/playwright";
import type { Config, MockServiceWorker } from "playwright-msw";
import { createWorkerFixture } from "playwright-msw";
import { handlers } from "../src/mocks/handlers";

export function testFactory(config: Config) {
	return playwrightTest.extend<{
		worker: MockServiceWorker;
		server: Interceptor;
		http: typeof http;
	}>({
		http,
		worker: createWorkerFixture(handlers, config),
		server: createInterceptorFixture(),
	});
}

const test = testFactory({ waitForPageLoad: true });
export { expect, test };
