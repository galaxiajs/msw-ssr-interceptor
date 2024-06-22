# `msw-ssr-interceptor`

[`msw`](https://mswjs.io) is great for mocking responses. However, it does not work well when
paired with [`playwright`](https://playwright.dev) in an SSR app. [`playwright-msw`](https://github.com/valendres/playwright-msw) works (very) well for
mocking browser-initiated requests but does not (and cannot) affect any server-side
requests; this means you cannot override server-side mock request handlers on a
per-test/suite basis - it is an _all or nothing_ approach.

This library aims to fill that gap. Now, there is already a (more advanced)
[PR](https://github.com/mswjs/msw/pull/1617) to bring this support natively into
msw but has not been merged due to time limitations. While the PR remains unmerged, this library can get you some of the way there.

## Installation

[`msw^2.0.0`](https://mswjs.io/docs/getting-started#step-1-install) is required:

```bash
npm install msw^2.0.0 msw-ssr-interceptor
```

```bash
pnpm install msw^2.0.0 msw-ssr-interceptor
```

```bash
yarn add msw^2.0.0 msw-ssr-interceptor
```

```bash
bun install msw^2.0.0 msw-ssr-interceptor
```

## Features

- Override mock handlers on a per-test basis in SSR apps
- Reset overidden mock handlers in SSR apps

## Usage

Usage should be identical to that of the [`setupServer`](https://mswjs.io/docs/api/setup-server/) API.

First, setup your mocks:

```javascript
// src/mocks/handlers.js
import { http, HttpResponse } from 'msw'
 
export const handlers = [
  // Intercept "GET https://example.com/user" requests...
  http.get('https://example.com/user', () => {
    // ...and respond to them using this JSON response.
    return HttpResponse.json({
      id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d',
      firstName: 'John',
      lastName: 'Maverick',
    })
  }),
]
```

Then, somewhere in your app, use the `setupRemoteServer` function from `msw-ssr-interceptor/node` instead of `setupServer` from `msw/node`:

```javascript
// src/mocks/node.js
import { setupRemoteServer } from 'msw-ssr-interceptor/node'
import { handlers } from './handlers'
 
export const server = setupServer(...handlers)
```

Then, wherever you'd like to override/add request handlers:

```javascript
// src/__tests__/home.test.js
import { setupIntercetptor, http } from 'msw-ssr-interceptor'

const server = await setupInterceptor() // async!
await server.use(
  // Overwrite the interception of "GET https://example.com/user" requests...
  http.get('https://example.com/user', () => {
    // ...and respond to them using this JSON response.
    return HttpResponse.json({
      id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d',
      firstName: 'John',
      lastName: 'Doe',
    })
  }),
) // also async!
```

**You must use the `http` export from `msw-ssr-interceptor` and _not_ the one from `msw`**

## How it works

In your SSR app, you call `setupRemoteServer` (exactly how you'd call `setupServer`). However,
internally, this also creates a web socket server.

Unlike msw, you cannot use the returned server from `setupServer` in your tests to
add/remove handlers. Instead, you must use the return value of `setupInterceptor` from `msw-ssr-interceptor`. Internally, `setupInterceptor` creates a web socket client and informs the server whenever you
add or remove request handlers. It does this by sending over a serialised representation of the handler; this includes a uniquely generated identifier for this request handler. On the server side, this representation is deserialised and then registered with/removed from your msw server running in your SSR app as needed. When a request is matched on the app side,
it sends that request to the client with the corresponding resolver ID which will then handle
the request on client, sending the response back to your SSR app. This approach avoids
function serialisation hell at the expense of network roundtrips.

All serialisation/de-serialisation is handled by [`seroval`](https://github.com/lxsmnsyc/seroval).

And that is it, no more and no less. The scope of this library is much smaller, and so it may have some gaps in features.

## Playwright

As a convenience, a `playwright` fixture is exported from `msw-ssr-interceptor/playwright`
that will inject the interceptor server into each test so you can override server-side fetches
with less boilerplate.

The following is an example of how you might use it with `playwright-msw`:

```typescript
import { expect, test as playwrightTest } from "@playwright/test";
import { http, type Interceptor } from "msw-ssr-interceptor";
import { createInterceptorFixture } from "msw-ssr-interceptor/playwright";
import type { Config, MockServiceWorker } from "playwright-msw";
import { createWorkerFixture } from "playwright-msw";
import { handlers } from "../src/mocks/handlers";

// Export function so we can pass different config as needed
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
```

## Contributing

See [Contributing Guide](CONTRIBUTING.md).

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
