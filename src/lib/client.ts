import { ClientMessage, ServerMessage } from "./utils/schemas";
import type {
	HttpMethod,
	HttpNamespace,
	HttpRequestHandler,
	Interceptor,
} from "./types";
import { createWebsocketClient } from "./utils/websocket";

function helper(method: HttpMethod): HttpRequestHandler {
	return function register(path, resolver, options = {}) {
		return { method, path, resolver, options };
	};
}

/**
 * A namespace to intercept and mock HTTP requests.
 *
 * @example
 * http.get('/user', resolver)
 * http.post('/post/:id', resolver)
 *
 * @see {@link https://mswjs.io/docs/api/http `http` API reference}
 */
export const http: HttpNamespace = {
	all: helper("all"),
	get: helper("get"),
	post: helper("post"),
	put: helper("put"),
	patch: helper("patch"),
	delete: helper("delete"),
	options: helper("options"),
	head: helper("head"),
};

export async function setupInterceptor(): Promise<Interceptor> {
	const socket = await createWebsocketClient({
		requests: ServerMessage,
		responses: ClientMessage,
	});

	return {
		async close() {
			return await socket.close();
		},
		use(...handlers) {
			socket.send("server:handler:add", handlers);

			return new Promise<void>((resolve) => {
				socket.on("server:handler:add", () => {
					socket.remove("server:handler:add");
					resolve();
				});
			});
		},

		resetHandlers(...handlers) {
			socket.send("server:handler:remove", handlers);

			return new Promise<void>((resolve) => {
				socket.on("server:handler:remove", () => {
					socket.remove("server:handler:remove");
					resolve();
				});
			});
		},
	};
}
