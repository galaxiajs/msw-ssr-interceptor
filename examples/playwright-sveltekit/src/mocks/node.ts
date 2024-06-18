import { setupRemoteServer } from "msw-ssr-interceptor/node";
import { handlers } from "./handlers";

export const server = setupRemoteServer(...handlers);
