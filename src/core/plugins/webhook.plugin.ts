import consola from "consola";
import { definePlugin } from "../factory/plugin";
import { coreWebhookEndpoints } from "../../schema/webhook";
import { sql } from "drizzle-orm";
import { webhookProvider } from "../provider/webhook.provider";

const webhookPlugin = definePlugin({
    name: 'Webhooks System',
    slug: 'webhook',
    providers: {
        webhook: webhookProvider
    },
    setup: ({ registry, providers, db }) => {
        consola.info('Webhook System aktiv')

        registry.GlobalHooks.on(async (collection, event, data) => {
            const eventName = `${collection}.${event}`

            const searchParam = JSON.stringify([eventName])

            const subscribers = await db.select().from(coreWebhookEndpoints.build()).where(
                sql`${coreWebhookEndpoints.build().events} @> ${searchParam}::jsonb AND ${coreWebhookEndpoints.build().isActive} = true`
            )

            if (subscribers.length === 0) {
                consola.warn('Keine Subscriber in der DB gefunden!')
                const all = await db.select().from(coreWebhookEndpoints.build())
                consola.debug('DUMP DB:', JSON.stringify(all, null, 2))
                return
            }

            for (const sub of subscribers) {
                providers.webhook.send(sub, eventName, data)
            }
        })
    }
})

export { webhookPlugin }