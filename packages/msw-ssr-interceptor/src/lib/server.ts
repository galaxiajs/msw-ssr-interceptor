import { http, type RequestHandler } from "msw";
import { type SetupServerApi, setupServer } from "msw/node";
import {
	ClientMessage,
	type RequestHandlerConfig,
	ServerMessage,
} from "./utils/schemas";
import { createWebsocketServer } from "./utils/websocket";

export function setupRemoteServer(
	...handlers: RequestHandler[]
): SetupServerApi {
	const server = setupServer(...handlers);
	const socket = createWebsocketServer({
		requests: ClientMessage,
		responses: ServerMessage,
	});

	function mapHandlers(serialisedHandlers: RequestHandlerConfig[]) {
		const handlers = serialisedHandlers.map(({ method, options, path, id }) => {
			const resolver = http[method](
				path,
				async (context) => {
					socket.send("server:handler:handle", { id, context });
					return new Promise<Response>((resolve) => {
						socket.on("server:handler:handled", (response) => {
							socket.remove("server:handler:handled");
							resolve(response);
						});
					});
				},
				options
			);

			return resolver;
		});

		return handlers;
	}

	socket.on("server:handler:add", (configs) => {
		const handlers = mapHandlers(configs);
		server.use(...handlers);
		socket.send("server:handler:add", { ok: true });
	});

	socket.on("server:handler:remove", (configs) => {
		const handlers = mapHandlers(configs);
		server.resetHandlers(...handlers);
		socket.send("server:handler:remove", { ok: true });
	});

	const close = server.close.bind(server);

	server.close = () => {
		close();
		socket.close();
	};

	return server;
}
