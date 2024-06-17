import { http, type RequestHandler } from "msw";
import { setupServer, type SetupServerApi } from "msw/node";
import { ClientMessage, ServerMessage } from "./utils/schemas";
import { createWebsocketServer } from "./utils/websocket";

export function setupRemoteServer(
	...handlers: RequestHandler[]
): SetupServerApi {
	const server = setupServer(...handlers);
	const socket = createWebsocketServer({
		requests: ClientMessage,
		responses: ServerMessage,
	});

	socket.on("server:handler:add", (serialisedHandlers) => {
		const handlers = serialisedHandlers.map(
			({ method, options, path, resolver }) =>
				http[method](
					path,
					async (ctx) => {
						// TODO: Need a better way of serialising context over
						const deps = new Set(options.dependencies ?? []);
						if (!deps.has("msw")) deps.add("msw");

						for (const dep of deps) {
							const mod = await import(dep);
							Object.assign(globalThis, mod);
						}

						return await resolver(ctx);
					},
					options
				)
		);

		server.use(...handlers);
		socket.send("server:handler:add", { ok: true });
	});

	socket.on("server:handler:remove", (_handlers) => {
		// TODO: How to reset handlers
		server.resetHandlers();
		socket.send("server:handler:remove", { ok: true });
	});

	const close = server.close.bind(server);

	server.close = () => {
		close();
		socket.close();
	};

	return server;
}
