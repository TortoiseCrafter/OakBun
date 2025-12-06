import { HTTPException } from "hono/http-exception";
import { defineMiddleware } from "../factory/middleware";

const systemGuard = defineMiddleware({
    handler: async (c, next) => {

        const headerKey = c.req.header('x-oak-system-key')

        const envKey = process.env.X_OAK_SYSTEM_KEY

        if (!envKey || headerKey !== envKey) {
            throw new HTTPException(404)
        }

        await next()
    },
    name: 'SystemGuard'
})

export { systemGuard }