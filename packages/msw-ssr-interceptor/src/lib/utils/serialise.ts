import { deserialize, serializeAsync } from "seroval";
import {
	BlobPlugin,
	FilePlugin,
	FormDataPlugin,
	HeadersPlugin,
	ReadableStreamPlugin,
	RequestPlugin,
	ResponsePlugin,
	URLPlugin,
	URLSearchParamsPlugin,
} from "seroval-plugins/web";
import { z } from "zod";
import { WebsocketEvent } from "./schemas";

/**
 * @internal
 */
export async function serialise(
	schema: z.ZodType<WebsocketEvent>,
	event: WebsocketEvent
): Promise<string> {
	const parsed = schema.parse(event);
	return await serializeAsync(parsed, {
		plugins: [
			BlobPlugin,
			FilePlugin,
			FormDataPlugin,
			HeadersPlugin,
			ReadableStreamPlugin,
			RequestPlugin,
			ResponsePlugin,
			URLPlugin,
			URLSearchParamsPlugin,
		],
	});
}

/**
 * @internal
 */
export async function deserialise<T extends WebsocketEvent>(
	schema: z.ZodType<T>,
	payload: string
): Promise<T> {
	const obj = deserialize(payload);
	return schema.parse(obj);
}
