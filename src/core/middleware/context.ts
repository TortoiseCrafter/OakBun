import { createMiddleware } from "hono/factory";
import { runInContext } from "../store";
import { Registry } from "../registry";

const contextMiddleware = createMiddleware(async (c, next) => {
    const auth = Registry.Auth;

    if (!auth) {
        await next();
        return;
    }

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