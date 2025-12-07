import { boolean, jsonb, text, uuid } from "drizzle-orm/pg-core";
import { defineTable } from "../../core/factory/table";

const coreWebhookEndpoints = defineTable('oak_webhook_endpoints').columns({
    id: uuid('id').primaryKey().defaultRandom(),
    events: jsonb('events').$type<string[]>().notNull(),
    isActive: boolean('is_active').default(true),
    ownerId: text('owner_id').notNull(),
    secret: text('secret').notNull(),
    url: text('url').notNull()
}).timestamps()

const coreWebhookLog = defineTable('oak_webhook_logs').columns({
    id: uuid('id').primaryKey().defaultRandom(),
    payload: jsonb('payload'),
    response: text('response'),
    status: text('status'),
    endpointId: uuid('endpoint_id').references(() => coreWebhookEndpoints.build().id)
}).timestamps()

export { coreWebhookEndpoints, coreWebhookLog }