import { z } from "zod";
import { WebsocketEvent } from "./schemas";
import serialize from "serialize-javascript";

// TODO: Need a proper serialisation library

/**
 * @internal
 */
export async function serialise(
	schema: z.ZodType<WebsocketEvent>,
	event: WebsocketEvent
): Promise<string> {
	const parsed = schema.parse(event);
	return serialize(parsed);
}

/**
 * @internal
 */
export async function deserialise<T extends WebsocketEvent>(
	schema: z.ZodType<T>,
	payload: string
): Promise<T> {
	// const obj = eval(`(${payload})`);
	const obj = new Function(`return (${payload});`)();
	return schema.parse(obj);
}
