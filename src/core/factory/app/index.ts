import { createFactory } from "hono/factory";

const factory = createFactory({
    initApp: (app) => { }
})

export { factory }