import { createMiddleware } from "hono/factory";
import { auth } from "../../config/auth";
import { runInContext } from "../store";

const contextMiddleware = createMiddleware(async (c, next) => {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    })

    const user = session?.user || null;
    const requestId = Bun.randomUUIDv7()

    c.set('user', user)
    c.set('session', session?.session || null)

    return runInContext({ requestId, user }, async () => {
        await next()
    })
})

export { contextMiddleware }