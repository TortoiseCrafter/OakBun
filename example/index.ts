import { defineApplication } from "../src";
import { schedulerPlugin } from "../src/plugins";

const { app } = await defineApplication(() => ({
    plugins: [
        schedulerPlugin
    ]
}))

export default app