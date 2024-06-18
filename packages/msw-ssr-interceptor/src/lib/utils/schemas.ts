import { z } from "zod";
import type { RequestHandlerContext } from "../types";

export type WebsocketEvent = z.infer<typeof WebsocketEvent>;
export const WebsocketEvent = z.object({
	type: z.string(),
	payload: z.any().optional(),
});

export type RequestHandlerConfig = z.infer<typeof RequestHandlerConfig>;
const RequestHandlerConfig = z.object({
	id: z.string(),
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
	options: z.object({ once: z.boolean().optional() }),
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
		payload: z.array(RequestHandlerConfig),
	}),
	z.object({
		type: z.literal("server:handler:remove"),
		payload: z.array(RequestHandlerConfig),
	}),
	z.object({
		type: z.literal("server:handler:handled"),
		payload: z.any(),
	}),
]);

const Context = z.object({
	id: z.string(),
	context: z.object({
		request: z.instanceof(Request),
		requestId: z.string(),
		cookies: z.record(z.string()),
		params: z.record(z.string().or(z.string().array().readonly())).readonly(),
	}) satisfies z.ZodType<RequestHandlerContext<any, any, any>>,
});
export type ServerMessage = z.infer<typeof ServerMessage>;
export const ServerMessage = z.union([
	z.object({ type: z.literal("server:handler:add"), payload: EventPayload }),
	z.object({ type: z.literal("server:handler:remove"), payload: EventPayload }),
	z.object({
		type: z.literal("server:handler:handle"),
		payload: Context,
	}),
]);
