import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import { EventFailure, WebsocketEvent } from "./schemas";
import { deserialise, serialise } from "./serialise";

export interface Options<
	Requests extends WebsocketEvent,
	Responses extends WebsocketEvent,
> {
	requests: z.ZodType<Requests>;
	responses: z.ZodType<Responses>;
}

export interface Handler<
	Requests extends WebsocketEvent,
	Responses extends WebsocketEvent,
> {
	send: <T extends Responses["type"]>(
		type: T,
		payload: Extract<Responses, { type: T }>["payload"]
	) => void;
	on: <T extends Requests["type"]>(
		type: T,
		handle: (event: Extract<Requests, { type: T }>["payload"]) => any
	) => void;
	remove: (type: Requests["type"]) => void;
	close: () => Promise<void>;
}

const WS_PORT = 4271;
const WS_URL = `ws://localhost:${WS_PORT}`;

/**
 * @internal
 */
export async function createWebsocketClient<
	In extends WebsocketEvent,
	Out extends WebsocketEvent,
>({ requests, responses }: Options<In, Out>): Promise<Handler<In, Out>> {
	const { add, remove, handle } = createMessageHandler(requests);

	return new Promise((resolve, reject) => {
		const ws = new WebSocket(WS_URL);
		ws.on("message", (data) => handle(data.toString()));
		ws.on("error", (err) => {
			console.error(err);
			reject(err);
		});
		ws.on("open", () => {
			resolve({
				on: add,
				remove: remove,
				close: async () => {
					ws.close();
				},
				async send(type, payload) {
					const serialised = await serialise(responses, { type, payload });
					ws.send(serialised);
				},
			});
		});
	});
}

/**
 * @internal
 */
export function createWebsocketServer<
	In extends WebsocketEvent,
	Out extends WebsocketEvent,
>({ requests, responses }: Options<In, Out>): Handler<In, Out> {
	const { add, remove, handle } = createMessageHandler(requests);

	const wss = new WebSocketServer({ port: WS_PORT });
	const client = new Promise<WebSocket>((resolve, reject) => {
		wss.on("error", reject);
		wss.on("connection", (ws) => {
			ws.onmessage = (event) => handle(event.data.toString());
			resolve(ws);
		});
	});

	return {
		on: add,
		remove: remove,
		close: () =>
			new Promise<void>((resolve, reject) => {
				wss.close((err) => {
					if (err) reject(err);
					resolve();
				});
			}),
		send(type, payload) {
			return new Promise<void>((resolve, reject) => {
				client.then((ws) => {
					if (ws.readyState === ws.OPEN) {
						serialise(responses, { type, payload }).then((serialised) => {
							ws.send(serialised, (err) => {
								if (err) reject(err);

								resolve();
							});
						});
					} else {
						resolve();
					}
				});
			});
		},
	};
}

function createMessageHandler(schema: z.ZodType<WebsocketEvent>) {
	const handlers = new Map<string, (payload: any) => any>();
	return {
		add: (type: string, handle: (payload: any) => any) =>
			handlers.set(type, handle),
		remove: (type: string) => handlers.delete(type),
		handle: async (data: string) => {
			const { type, payload } = await deserialise(schema, data);
			const result = EventFailure.safeParse(payload);
			if (result.success && result.data.ok === false)
				throw new Error(`[${type}] ${result.data.error}`);

			const handleEvent = handlers.get(type);
			if (handleEvent) await handleEvent(payload);
		},
	};
}
