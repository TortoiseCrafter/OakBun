import { createMiddleware } from "hono/factory";
import { createScope } from "../logger";

const httpLog = createScope('HTTP')

const httpLogger = createMiddleware(async (c, next) => {
    const start = performance.now()
    const { method, path } = c.req

    await next()

    const end = performance.now()
    const time = (end - start).toFixed(1)
    const status = c.res.status

    const msg = `[${status}] ${method} ${path} (${time}ms)`

    if (status >= 500) {
        httpLog.error(msg)
    } else if (status >= 400) {
        httpLog.warn(msg)
    } else {
        httpLog.success(msg)
    }
})

export { httpLogger }