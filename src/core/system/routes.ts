
import { defineRoute } from "../factory/router";
import { Registry } from "../registry";
import { systemGuard } from "./middleware";

const systemRoutes = defineRoute('__system')
    .middleware([systemGuard])
    .custom(() => [
        {
            handler: async (c) => {
                const body = await c.req.json()
                const signature = body.command
                const args = body.args || []

                if (!signature) {
                    return c.json({ error: 'No command specified' }, 400)
                }

                const command = Registry.Commands.get(signature)

                if (!command) {
                    return c.json({ error: `Command '${signature}' not found` }, 404)
                }

                try {
                    await command.handle(args)

                    return c.json({ success: true, message: `Executed ${signature}` })
                } catch (e: any) {
                    return c.json({ success: false, error: e.message }, 500)
                }
            },
            method: 'POST',
            path: '/commands/run'
        }
    ])

export { systemRoutes }