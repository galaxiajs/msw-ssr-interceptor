import { z } from "zod";
import type { SerialisableRequestHandler } from "../types";

export type WebsocketEvent = z.infer<typeof WebsocketEvent>;
export const WebsocketEvent = z.object({
	type: z.string(),
	payload: z.any().optional(),
});

// @ts-expect-error
const RequestHandler: z.ZodType<SerialisableRequestHandler> = z.object({
	method: z.enum([
		"all",
		"get",
		"put",
		"patch",
		"post",
		"delete",
		"options",
		"head",
	]),
	path: z.string().or(z.instanceof(RegExp)),
	resolver: z.any(),
	options: z.any(),
});

export type EventFailure = z.infer<typeof EventFailure>;
export const EventFailure = z.object({
	ok: z.literal(false),
	error: z.string(),
});

const EventSuccess = z.object({ ok: z.literal(true) });
const EventPayload = EventSuccess.or(EventFailure);

export type ClientMessage = z.infer<typeof ClientMessage>;
export const ClientMessage = z.union([
	z.object({
		type: z.literal("server:handler:add"),
		payload: z.array(RequestHandler),
	}),
	z.object({
		type: z.literal("server:handler:remove"),
		payload: z.array(RequestHandler),
	}),
]);

export type ServerMessage = z.infer<typeof ServerMessage>;
export const ServerMessage = z.union([
	z.object({ type: z.literal("server:handler:add"), payload: EventPayload }),
	z.object({ type: z.literal("server:handler:remove"), payload: EventPayload }),
]);
