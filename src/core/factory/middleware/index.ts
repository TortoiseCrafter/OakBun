import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";

const defineMiddleware = (options: { name: string, handler: MiddlewareHandler }) => {
    return createMiddleware(options.handler)
}

export { defineMiddleware }