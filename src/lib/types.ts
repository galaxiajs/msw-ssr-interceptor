import type {
	DefaultBodyType,
	HttpResponseResolver,
	Path,
	PathParams,
	RequestHandlerOptions,
	http as mswHttp,
} from "msw";

export type HttpRequestHandler = <
	Params extends PathParams<keyof Params> = PathParams,
	RequestBodyType extends DefaultBodyType = DefaultBodyType,
	ResponseBodyType extends DefaultBodyType = undefined,
	RequestPath extends Path = Path,
>(
	path: RequestPath,
	resolver: HttpResponseResolver<Params, RequestBodyType, ResponseBodyType>,
	options?: RequestHandlerOptions
) => SerialisableRequestHandler;

export type RequestHandlerContext<
	Params extends PathParams<keyof Params> = PathParams,
	RequestBodyType extends DefaultBodyType = DefaultBodyType,
	ResponseBodyType extends DefaultBodyType = undefined,
> = Parameters<
	HttpResponseResolver<Params, RequestBodyType, ResponseBodyType>
>[0];

export type HttpMethod = keyof typeof mswHttp;
export type HttpNamespace = {
	[K in HttpMethod]: HttpRequestHandler;
};

export interface InterceptorRequestHandlerOptions
	extends RequestHandlerOptions {
	dependencies?: string[];
}

export interface SerialisableRequestHandler {
	path: Path;
	method: HttpMethod;
	resolver: HttpResponseResolver<any, any, any>;
	options: InterceptorRequestHandlerOptions;
}

export interface Interceptor {
	close: () => Promise<void>;
	use: (...customHandlers: SerialisableRequestHandler[]) => Promise<void>;
	resetHandlers: (
		...customHandlers: SerialisableRequestHandler[]
	) => Promise<void>;
}
