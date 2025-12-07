import { defineApplication } from "../src";
import { auditPlugin, schedulerPlugin } from "../src/plugins";

const { app } = await defineApplication(() => ({
    plugins: [
        // schedulerPlugin
        auditPlugin
    ]
}))

export default app