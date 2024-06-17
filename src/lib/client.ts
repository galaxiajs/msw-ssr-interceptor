import crypto from "node:crypto";
import { type HttpResponseResolver, passthrough } from "msw";
import type {
	HttpMethod,
	HttpNamespace,
	HttpRequestHandler,
	Interceptor,
} from "./types";
import {
	ClientMessage,
	type RequestHandlerConfig,
	ServerMessage,
} from "./utils/schemas";
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

interface HandlerConfig extends RequestHandlerConfig {
	resolver: RegisteredResolver;
}

type RegisteredResolver = HttpResponseResolver<any, any, any> & {
	readonly __identifier__: unique symbol;
	readonly __resolverId__: string;
};

const IDENTIFIER = Symbol("msw:id");

export async function setupInterceptor(): Promise<Interceptor> {
	const router = new Map<string, HandlerConfig>();
	const socket = await createWebsocketClient({
		requests: ServerMessage,
		responses: ClientMessage,
	});

	socket.on("server:handler:handle", async ({ id, context }) => {
		const config = router.get(id);
		if (config) {
			const response = await config.resolver(context);
			socket.send("server:handler:handled", response);
		} else {
			socket.send("server:handler:handled", passthrough());
		}
	});

	return {
		async close() {
			return await socket.close();
		},
		use(...handlers) {
			const configs: RequestHandlerConfig[] = [];

			for (const { resolver, ...handler } of handlers) {
				const registered = registerResolver(resolver);
				const resolverId = registered.__resolverId__;
				configs.push({ ...handler, id: resolverId });
				router.set(resolverId, {
					...handler,
					id: resolverId,
					resolver: registered,
				});
			}

			socket.send("server:handler:add", configs);

			return new Promise<void>((resolve) => {
				socket.on("server:handler:add", () => {
					socket.remove("server:handler:add");
					resolve();
				});
			});
		},

		resetHandlers(...handlers) {
			const configs: RequestHandlerConfig[] = [];

			for (const { resolver } of handlers) {
				if (isRegistered(resolver) && router.has(resolver.__resolverId__)) {
					const resolverId = resolver.__resolverId__;
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					const { resolver: _, ...rest } = router.get(resolverId)!;
					configs.push(rest);
					router.delete(resolverId);
				}
			}

			socket.send("server:handler:remove", configs);

			return new Promise<void>((resolve) => {
				socket.on("server:handler:remove", () => {
					socket.remove("server:handler:remove");
					resolve();
				});
			});
		},
	};
}

function isRegistered(resolver: unknown): resolver is RegisteredResolver {
	return (
		typeof resolver === "function" &&
		"__identifier__" in resolver &&
		resolver.__identifier__ === IDENTIFIER &&
		"__resolverId__" in resolver &&
		typeof resolver.__resolverId__ === "string"
	);
}

function registerResolver(
	resolver: HttpResponseResolver<any, any, any>
): RegisteredResolver {
	const id = uuid();
	return Object.assign(resolver, {
		get __identifier__() {
			return IDENTIFIER as any;
		},
		get __resolverId__() {
			return id;
		},
	});
}

function uuid(): string {
	return crypto.randomBytes(16).toString("hex");
}
